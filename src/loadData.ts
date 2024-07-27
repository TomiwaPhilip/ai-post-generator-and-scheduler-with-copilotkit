// src/loadUserData.ts
import { UserData } from './types';
import fs from 'fs';
import path from 'path';

export const loadUserData = (): UserData => {
    const dataPath = path.resolve('./src/user.json');
    const jsonData = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(jsonData) as UserData;
}
