const { User, Module, UserModuleAccess, UserToken } = require('../../models');
const sequelize = require('../../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');

const getJwtSecret = () => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured. Add it to backend/.env as described in AUTH_SETUP.md.");
    }
    return process.env.JWT_SECRET;
};

const getRefreshTokenSecret = () => {
    if (!process.env.REFRESH_TOKEN_SECRET) {
        throw new Error("REFRESH_TOKEN_SECRET is not configured. Add it to backend/.env as described in AUTH_SETUP.md.");
    }
    return process.env.REFRESH_TOKEN_SECRET;
};

const createRefreshToken = () => crypto
    .createHmac('sha256', getRefreshTokenSecret())
    .update(crypto.randomBytes(64))
    .digest('hex');

const signAccessToken = (user, modules) => jwt.sign(
    {
        sub: user.User_ID,
        username: user.Username,
        user_type: user.User_Type,
        modules
    },
    getJwtSecret(),
    { expiresIn: '1h' }
);

/**
 * Login User
 */
const loginUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            await t.rollback();
            return res.status(400).json({ success: false, error: "Username and password are required" });
        }

        if (!User) {
            throw new Error("User model not loaded");
        }

        const user = await User.findOne({ where: { Username: username } });
        
        if (!user) {
            await t.rollback();
            return res.status(401).json({ success: false, error: "Invalid username or password" });
        }

        if (user.Status !== 'Active') {
            await t.rollback();
            return res.status(403).json({ success: false, error: "Account is inactive or suspended" });
        }

        if (user.Account_Locked_Until && new Date(user.Account_Locked_Until) > new Date()) {
            await t.rollback();
            return res.status(403).json({ success: false, error: "Account is locked. Try again later." });
        }

        const isPasswordValid = await bcrypt.compare(password, user.Password_Hash);
        
        if (!isPasswordValid) {
            const attempts = (user.Failed_Login_Attempts || 0) + 1;
            await user.update({ 
                Failed_Login_Attempts: attempts,
                Account_Locked_Until: attempts >= 5 ? new Date(Date.now() + 15 * 60000) : null
            }, { transaction: t });
            await t.commit();
            return res.status(401).json({ success: false, error: "Invalid username or password" });
        }

        await user.update({ Failed_Login_Attempts: 0, Last_Login: new Date() }, { transaction: t });

        const permissions = await UserModuleAccess.findAll({
            where: { User_ID: user.User_ID },
            include: [{ 
                model: Module, 
                as: 'Module', 
                where: { Is_Active: true },
                required: false 
            }]
        });
        
        const moduleKeys = permissions.map(p => p.Module ? p.Module.Module_Key : null).filter(Boolean);

        const accessToken = signAccessToken(user, moduleKeys);

        const refreshToken = createRefreshToken();
        const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

        if (!UserToken) {
            throw new Error("UserToken model not loaded");
        }

        await UserToken.create({
            User_ID: user.User_ID,
            Refresh_Token: hashedRefreshToken,
            Expires_At: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            IP_Address: req.ip || '127.0.0.1',
            Device_Info: req.headers['user-agent'] || 'unknown'
        }, { transaction: t });

        await t.commit();
        return res.status(200).json({
            success: true,
            access_token: accessToken,
            refresh_token: refreshToken,
            modules: moduleKeys,
            user_id: user.User_ID,
            username: user.Username,
            user_type: user.User_Type,
            full_name: user.Full_Name
        });
    } catch (error) {
        if (t) await t.rollback();
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Register User
 */
const registerUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { username, password, full_name, email, phone, user_type, modules } = req.body;
        const existingUser = await User.findOne({ where: { Username: username } });
        if (existingUser) {
            await t.rollback();
            return res.status(409).json({ success: false, error: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            Username: username,
            Password_Hash: hashedPassword,
            Full_Name: full_name,
            Email: email,
            Phone: phone,
            User_Type: user_type,
            Status: 'Active'
        }, { transaction: t });

        if (modules && Array.isArray(modules)) {
            const moduleAssignments = modules.map(mId => ({ User_ID: newUser.User_ID, Module_ID: mId, Granted_By: req.user?.sub }));
            await UserModuleAccess.bulkCreate(moduleAssignments, { transaction: t });
        }

        await t.commit();
        return res.status(201).json({ success: true, message: "User created successfully", user_id: newUser.User_ID });
    } catch (error) {
        if (t) await t.rollback();
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

/**
 * Get All Users (Hiding Inactive)
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { Status: { [Op.ne]: 'Inactive' } },
            attributes: { exclude: ['Password_Hash'] },
            include: [{ model: UserModuleAccess, as: 'ModuleAccess', include: [{ model: Module, as: 'Module' }] }]
        });
        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.error("GET ALL USERS ERROR:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

/**
 * Search User (Hiding Inactive)
 */
const searchUser = async (req, res) => {
    try {
        const q = req.query.q || '';
        const users = await User.findAll({
            where: { 
                Username: { [Op.like]: `${q}%` },
                Status: { [Op.ne]: 'Inactive' }
            },
            attributes: { exclude: ['Password_Hash'] },
            include: [{ model: UserModuleAccess, as: 'ModuleAccess', include: [{ model: Module, as: 'Module' }] }],
            order: [['Username', 'ASC']]
        });
        return res.status(200).json({ success: true, users });
    } catch (err) {
        console.error("SEARCH USER ERROR:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

/**
 * Get All Modules
 */
const getAllModels = async (req, res) => {
    try {
        const models = await Module.findAll({
            where: { Is_Active: true },
            attributes: ['Module_ID', 'Module_Name', 'Module_Key']
        });
        return res.status(200).json({ success: true, models });
    } catch (error) {
        console.error("GET ALL MODULES ERROR:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

/**
 * Update User
 */
const updateUser = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { User_ID, Username, Full_Name, Email, Phone, User_Type, Status, modules } = req.body;
        const userRecord = await User.findByPk(User_ID);
        if (!userRecord) {
            await t.rollback();
            return res.status(404).json({ success: false, error: "User not found" });
        }

        await userRecord.update({ Username, Full_Name, Email, Phone, User_Type, Status }, { transaction: t });

        if (modules && Array.isArray(modules)) {
            await UserModuleAccess.destroy({ where: { User_ID }, transaction: t });
            const moduleAssignments = modules.map(mId => ({ User_ID, Module_ID: mId, Granted_By: req.user?.sub }));
            await UserModuleAccess.bulkCreate(moduleAssignments, { transaction: t });
        }
        await t.commit();
        return res.status(200).json({ success: true, message: "User updated successfully" });
    } catch (error) {
        if (t) await t.rollback();
        console.error("UPDATE USER ERROR:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

/**
 * Delete User (Soft Delete)
 */
const deleteUser = async (req, res) => {
    console.log(`>>> [DEBUG] Soft-deleting user ID: ${req.body.User_ID}`);
    const t = await sequelize.transaction();
    try {
        const { User_ID } = req.body;
        
        const userRecord = await User.findByPk(User_ID);
        if (!userRecord) {
            await t.rollback();
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // 1. Mark as Inactive (Soft Delete)
        await userRecord.update({ Status: 'Inactive' }, { transaction: t });
        console.log(">>> [DEBUG] User marked as Inactive");

        // 2. Revoke all active sessions (tokens) for safety
        await UserToken.destroy({ where: { User_ID }, transaction: t });
        console.log(">>> [DEBUG] Revoked all user tokens");

        await t.commit();
        return res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        if (t) await t.rollback();
        console.error(">>> [DEBUG] DELETE USER ERROR:", error.message);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

/**
 * Silent Refresh Token
 */
const refreshToken = async (req, res) => {
    try {
        const { refresh_token: rawRefreshToken } = req.body;
        if (!rawRefreshToken) return res.status(400).json({ error: "Refresh token required" });

        const tokens = await UserToken.findAll({
            where: { Revoked: false, Expires_At: { [Op.gt]: new Date() } },
            include: [{ model: User, as: 'User' }]
        });

        let matchedToken = null;
        for (const tokenRow of tokens) {
            if (await bcrypt.compare(rawRefreshToken, tokenRow.Refresh_Token)) {
                matchedToken = tokenRow;
                break;
            }
        }

        if (!matchedToken || !matchedToken.User || matchedToken.User.Status !== 'Active') {
            return res.status(401).json({ error: "Invalid refresh token" });
        }

        const user = matchedToken.User;
        const permissions = await UserModuleAccess.findAll({
            where: { User_ID: user.User_ID },
            include: [{ model: Module, as: 'Module', where: { Is_Active: true } }]
        });
        const moduleKeys = permissions.map(p => p.Module.Module_Key);

        const newAccessToken = signAccessToken(user, moduleKeys);

        return res.status(200).json({ success: true, access_token: newAccessToken, modules: moduleKeys });
    } catch (error) {
        console.error("REFRESH TOKEN ERROR:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

/**
 * Logout User
 */
const logoutUser = async (req, res) => {
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) return res.status(400).json({ error: "Refresh token required" });

        const userTokens = await UserToken.findAll({ where: { User_ID: req.user.sub, Revoked: false } });

        for (const token of userTokens) {
            if (await bcrypt.compare(refresh_token, token.Refresh_Token)) {
                await token.update({ Revoked: true, Revoked_At: new Date() });
                break;
            }
        }

        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

module.exports = {
    loginUser,
    registerUser,
    getAllUsers,
    searchUser,
    getAllModels,
    updateUser,
    deleteUser,
    refreshToken,
    logoutUser
};
