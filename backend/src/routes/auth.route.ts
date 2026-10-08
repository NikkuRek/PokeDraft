import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth.controller.js';
import { validateFields } from '../middlewares/validate-fields.middlewares.js';
import { validateJWT } from '../middlewares/validate-token.middlewares.js';

const router = Router();

router.post(
  '/register',
  [
    body('email', 'El correo debe ser un email válido').isEmail(),
    body('password', 'La contraseña debe tener al menos 6 caracteres').isLength({ min: 6 }),
    validateFields
  ],
  AuthController.register
);

router.post(
  '/login',
  [
    body('email', 'El correo es requerido').isEmail(),
    body('password', 'La contraseña es requerida').notEmpty(),
    validateFields
  ],
  AuthController.login
);

router.get('/profile', validateJWT, AuthController.getProfile);

export default router;
