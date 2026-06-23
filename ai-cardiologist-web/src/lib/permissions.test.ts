import { describe, expect, it } from 'vitest';
import { hasPermission, mapRoleToPermissions } from './permissions';

describe('mapRoleToPermissions (AI Cardiologist RBAC)', () => {
  it('grants owner full prediction and research scopes', () => {
    const perms = mapRoleToPermissions('owner');
    expect(perms).toContain('predict.run');
    expect(perms).toContain('predict.batch');
    expect(perms).toContain('model.read');
    expect(perms).toContain('research.read');
    expect(perms).toContain('org.delete');
  });

  it('denies org.delete for admin role', () => {
    expect(hasPermission('admin', 'org.delete')).toBe(false);
    expect(hasPermission('admin', 'predict.batch')).toBe(true);
  });

  it('grants researcher batch and model read', () => {
    expect(hasPermission('researcher', 'predict.batch')).toBe(true);
    expect(hasPermission('researcher', 'model.read')).toBe(true);
    expect(hasPermission('researcher', 'settings:manage')).toBe(false);
  });

  it('denies predict.batch and model.read for individual role', () => {
    expect(hasPermission('individual', 'predict.run')).toBe(true);
    expect(hasPermission('individual', 'predict.batch')).toBe(false);
    expect(hasPermission('individual', 'model.read')).toBe(false);
  });

  it('grants research.read to all roles', () => {
    for (const role of ['owner', 'admin', 'researcher', 'individual'] as const) {
      expect(hasPermission(role, 'research.read')).toBe(true);
    }
  });
});
