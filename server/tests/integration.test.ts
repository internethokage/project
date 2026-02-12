import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { after, before, describe, it } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DATABASE_IN_MEMORY = 'true';
process.env.JWT_SECRET = 'integration-test-secret';
process.env.APP_URL = 'http://localhost';
process.env.CORS_ORIGIN = 'http://localhost:5173';

const { createApp } = await import('../src/app.js');
const { runMigrations } = await import('../src/bootstrap.js');

let server: Server;
let baseUrl = '';

const uniqueSuffix = `${Date.now()}`;
const users = {
  alice: {
    email: `alice.${uniqueSuffix}@example.com`,
    password: 'alice-password-123',
  },
  bob: {
    email: `bob.${uniqueSuffix}@example.com`,
    password: 'bob-password-123',
    nextPassword: 'bob-password-456',
  },
  charlie: {
    email: `charlie.${uniqueSuffix}@example.com`,
    password: 'charlie-password-123',
    nextPassword: 'charlie-password-456',
  },
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
}

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<{ status: number; body: T }> {
  const headers: Record<string, string> = {};

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let body: string | undefined;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? (body ? 'POST' : 'GET'),
    headers,
    body,
  });

  const payload = (await response.json().catch(() => ({}))) as T;
  return { status: response.status, body: payload };
}

function extractTokenFromUrl(url: string): string {
  const parsed = new URL(url);
  const token = parsed.searchParams.get('token');
  assert.ok(token, 'reset token should be present in URL');
  return token;
}

before(async () => {
  await runMigrations();

  const app = createApp();
  server = app.listen(0, '127.0.0.1');

  await new Promise<void>((resolve) => {
    server.once('listening', () => resolve());
  });

  const address = server.address() as AddressInfo | null;
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind test server');
  }

  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (!server) return;

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

describe('Giftable API integration', { concurrency: 1 }, () => {
  it('enforces authentication for protected routes', async () => {
    const people = await apiRequest<{ error: string }>('/api/people');
    assert.equal(people.status, 401);
    assert.equal(people.body.error, 'Missing authorization header');
  });

  it('handles auth and full occasion/people/gift CRUD flow', async () => {
    const register = await apiRequest<{ token: string; user: { id: string; email: string; isAdmin: boolean } }>('/api/auth/register', {
      method: 'POST',
      body: { email: users.alice.email, password: users.alice.password },
    });
    assert.equal(register.status, 201);
    assert.equal(register.body.user.email, users.alice.email);
    assert.equal(register.body.user.isAdmin, true);

    const token = register.body.token;

    const verify = await apiRequest<{ valid: boolean; user?: { email: string } }>('/api/auth/verify', {
      token,
    });
    assert.equal(verify.status, 200);
    assert.equal(verify.body.valid, true);
    assert.equal(verify.body.user?.email, users.alice.email);

    const me = await apiRequest<{ user: { email: string } }>('/api/auth/me', {
      token,
    });
    assert.equal(me.status, 200);
    assert.equal(me.body.user.email, users.alice.email);

    const occasion = await apiRequest<{ id: string; type: string }>('/api/occasions', {
      method: 'POST',
      token,
      body: { type: 'Birthday', date: '2030-01-01', budget: 150 },
    });
    assert.equal(occasion.status, 201);
    assert.equal(occasion.body.type, 'Birthday');

    const person = await apiRequest<{ id: string; name: string }>('/api/people', {
      method: 'POST',
      token,
      body: { name: 'Sam', relationship: 'Friend', budget: 100 },
    });
    assert.equal(person.status, 201);
    assert.equal(person.body.name, 'Sam');

    const gift = await apiRequest<{ id: string; status: string }>('/api/gifts', {
      method: 'POST',
      token,
      body: { person_id: person.body.id, title: 'Headphones', price: 89, status: 'idea' },
    });
    assert.equal(gift.status, 201);
    assert.equal(gift.body.status, 'idea');

    const invalidGift = await apiRequest<{ error: string }>('/api/gifts', {
      method: 'POST',
      token,
      body: { person_id: '00000000-0000-0000-0000-000000000000', title: 'Invalid' },
    });
    assert.equal(invalidGift.status, 404);

    const purchasedGift = await apiRequest<{ status: string; date_purchased?: string }>(`/api/gifts/${gift.body.id}/status`, {
      method: 'PATCH',
      token,
      body: { status: 'purchased' },
    });
    assert.equal(purchasedGift.status, 200);
    assert.equal(purchasedGift.body.status, 'purchased');
    assert.ok(purchasedGift.body.date_purchased);

    const givenGift = await apiRequest<{ status: string; date_given?: string }>(`/api/gifts/${gift.body.id}/status`, {
      method: 'PATCH',
      token,
      body: { status: 'given' },
    });
    assert.equal(givenGift.status, 200);
    assert.equal(givenGift.body.status, 'given');
    assert.ok(givenGift.body.date_given);

    const giftsBeforeDelete = await apiRequest<Array<{ id: string }>>('/api/gifts', {
      token,
    });
    assert.equal(giftsBeforeDelete.status, 200);
    assert.equal(giftsBeforeDelete.body.length, 1);

    const deletePerson = await apiRequest<{ message: string }>(`/api/people/${person.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deletePerson.status, 200);

    const giftsAfterDelete = await apiRequest<Array<{ id: string }>>('/api/gifts', {
      token,
    });
    assert.equal(giftsAfterDelete.status, 200);
    assert.equal(giftsAfterDelete.body.length, 0);

    const deleteOccasion = await apiRequest<{ message: string }>(`/api/occasions/${occasion.body.id}`, {
      method: 'DELETE',
      token,
    });
    assert.equal(deleteOccasion.status, 200);

    const logout = await apiRequest<{ message: string }>('/api/auth/logout', {
      method: 'POST',
      token,
      body: {},
    });
    assert.equal(logout.status, 200);

    const verifyAfterLogout = await apiRequest<{ valid: boolean }>('/api/auth/verify', {
      token,
    });
    assert.equal(verifyAfterLogout.status, 401);
    assert.equal(verifyAfterLogout.body.valid, false);

    const peopleAfterLogout = await apiRequest<{ error: string }>('/api/people', {
      token,
    });
    assert.equal(peopleAfterLogout.status, 401);
  });

  it('supports forgot/reset password flow', async () => {
    const register = await apiRequest<{ token: string }>('/api/auth/register', {
      method: 'POST',
      body: { email: users.bob.email, password: users.bob.password },
    });
    assert.equal(register.status, 201);

    const forgot = await apiRequest<{ previewResetUrl?: string; mailboxPreviewUrl?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: users.bob.email },
    });
    assert.equal(forgot.status, 200);
    assert.ok(forgot.body.previewResetUrl);
    assert.ok(forgot.body.mailboxPreviewUrl);

    const resetToken = extractTokenFromUrl(forgot.body.previewResetUrl!);
    const reset = await apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, password: users.bob.nextPassword },
    });
    assert.equal(reset.status, 200);

    const oldPasswordLogin = await apiRequest<{ error: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: users.bob.email, password: users.bob.password },
    });
    assert.equal(oldPasswordLogin.status, 401);

    const newPasswordLogin = await apiRequest<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: users.bob.email, password: users.bob.nextPassword },
    });
    assert.equal(newPasswordLogin.status, 200);
  });

  it('supports admin authorization and management flows', async () => {
    const aliceLogin = await apiRequest<{ token: string; user: { isAdmin: boolean } }>('/api/auth/login', {
      method: 'POST',
      body: { email: users.alice.email, password: users.alice.password },
    });
    assert.equal(aliceLogin.status, 200);
    assert.equal(aliceLogin.body.user.isAdmin, true);
    const aliceToken = aliceLogin.body.token;

    const charlieRegister = await apiRequest<{ token: string; user: { id: string; isAdmin: boolean } }>('/api/auth/register', {
      method: 'POST',
      body: { email: users.charlie.email, password: users.charlie.password },
    });
    assert.equal(charlieRegister.status, 201);
    assert.equal(charlieRegister.body.user.isAdmin, false);

    const nonAdminListUsers = await apiRequest<{ error: string }>('/api/admin/users', {
      token: charlieRegister.body.token,
    });
    assert.equal(nonAdminListUsers.status, 403);

    const adminListUsers = await apiRequest<{ users: Array<{ id: string; email: string }> }>('/api/admin/users', {
      token: aliceToken,
    });
    assert.equal(adminListUsers.status, 200);
    const charlieUser = adminListUsers.body.users.find((user) => user.email === users.charlie.email);
    assert.ok(charlieUser);

    const promoteCharlie = await apiRequest<{ user: { is_admin: boolean } }>(`/api/admin/users/${charlieUser.id}/admin`, {
      method: 'PATCH',
      token: aliceToken,
      body: { isAdmin: true },
    });
    assert.equal(promoteCharlie.status, 200);
    assert.equal(promoteCharlie.body.user.is_admin, true);

    const charlieAdminLogin = await apiRequest<{ token: string; user: { isAdmin: boolean } }>('/api/auth/login', {
      method: 'POST',
      body: { email: users.charlie.email, password: users.charlie.password },
    });
    assert.equal(charlieAdminLogin.status, 200);
    assert.equal(charlieAdminLogin.body.user.isAdmin, true);

    const promotedListUsers = await apiRequest<{ users: Array<{ id: string }> }>('/api/admin/users', {
      token: charlieAdminLogin.body.token,
    });
    assert.equal(promotedListUsers.status, 200);
    assert.ok(promotedListUsers.body.users.length >= 3);

    const resetLink = await apiRequest<{ resetUrl: string }>(`/api/admin/users/${charlieUser.id}/reset-link`, {
      method: 'POST',
      token: aliceToken,
      body: {},
    });
    assert.equal(resetLink.status, 200);
    assert.ok(resetLink.body.resetUrl);

    const charlieResetToken = extractTokenFromUrl(resetLink.body.resetUrl);
    const charlieReset = await apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: { token: charlieResetToken, password: users.charlie.nextPassword },
    });
    assert.equal(charlieReset.status, 200);

    const charlieOldPasswordLogin = await apiRequest<{ error: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: users.charlie.email, password: users.charlie.password },
    });
    assert.equal(charlieOldPasswordLogin.status, 401);

    const charlieNewPasswordLogin = await apiRequest<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: users.charlie.email, password: users.charlie.nextPassword },
    });
    assert.equal(charlieNewPasswordLogin.status, 200);

    const deleteCharlie = await apiRequest<{ message: string }>(`/api/admin/users/${charlieUser.id}`, {
      method: 'DELETE',
      token: aliceToken,
    });
    assert.equal(deleteCharlie.status, 200);

    const charlieDeletedLogin = await apiRequest<{ error: string }>('/api/auth/login', {
      method: 'POST',
      body: { email: users.charlie.email, password: users.charlie.nextPassword },
    });
    assert.equal(charlieDeletedLogin.status, 401);
  });
});
