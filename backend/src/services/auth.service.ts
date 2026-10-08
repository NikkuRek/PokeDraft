import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { generateJWT } from '../helpers/jwt.helpers.js';
import { IUser, IAuthPayload } from '../interfaces/index.js';

export class AuthService {
  public static async register(email: string, password: string, role: 'ADMIN' | 'COACH' = 'COACH'): Promise<{ user: Partial<IUser>; token: string }> {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw { statusCode: 400, message: 'El correo electrónico ya se encuentra registrado.' };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      role
    });

    const payload: IAuthPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = generateJWT(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  public static async login(email: string, password: string): Promise<{ user: Partial<IUser>; token: string }> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw { statusCode: 400, message: 'Credenciales inválidas (usuario o contraseña incorrectos).' };
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw { statusCode: 400, message: 'Credenciales inválidas (usuario o contraseña incorrectos).' };
    }

    const payload: IAuthPayload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const token = generateJWT(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  public static async getProfile(userId: number): Promise<Partial<IUser>> {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'role', 'created_at']
    });
    if (!user) {
      throw { statusCode: 404, message: 'Usuario no encontrado.' };
    }
    return user;
  }
}
