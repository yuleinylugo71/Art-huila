import { Reflector } from '@nestjs/core';
import { AdminController } from './admin.controller';
import { RolesGuard } from '../auth/guards/jwt-auth.guard';

describe('AdminController HU-02', () => {
  it('solo admin puede llamar a /admin/artesanos/:id/verificar', () => {
    const roles = Reflect.getMetadata('roles', AdminController);
    expect(roles).toContain('admin');

    const guard = new RolesGuard(new Reflector());
    const context: any = {
      getHandler: () => AdminController.prototype.verificarArtesano,
      getClass: () => AdminController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role: 'artesano' } }) }),
    };

    expect(() => guard.canActivate(context)).toThrow('No tienes permisos');
  });
});
