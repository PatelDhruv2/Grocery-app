import prisma from "../config/db.config.js";
import redisClient from "../config/redis.config.js";

const TTL_SECONDS = 30;

const cacheKey = (name) => `stats:${name}`;

const readCachedJson = async (key) => {
    const cached = await redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
};

const writeCachedJson = async (key, value) => {
    await redisClient.set(key, JSON.stringify(value), { EX: TTL_SECONDS });
};

export const totalusers = async (req, res) => {
    try {
        const key = cacheKey("totalusers");
        const cached = await readCachedJson(key);
        if (cached) {
            return res.status(200).json(cached);
        }

        const total = await prisma.user.count({
            where: {
                isAdmin: false,
            },
        });

        const payload = { total };
        await writeCachedJson(key, payload);
        res.status(200).json(payload);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const totalorders = async (req, res) => {
    try {
        const key = cacheKey("totalorders");
        const cached = await readCachedJson(key);
        if (cached) {
            return res.status(200).json(cached);
        }

        const total = await prisma.order.count();
        const payload = { total };
        await writeCachedJson(key, payload);
        res.status(200).json(payload);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const totalpendingorders = async (req, res) => {
    try {
        const key = cacheKey("totalpendingorders");
        const cached = await readCachedJson(key);
        if (cached) {
            return res.status(200).json(cached);
        }

        const total = await prisma.order.count({
            where: {
                status: "pending",
            },
        });
        const payload = { total };
        await writeCachedJson(key, payload);
        res.status(200).json(payload);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const totalcompletedorders = async (req, res) => {
    try {
        const key = cacheKey("totalcompletedorders");
        const cached = await readCachedJson(key);
        if (cached) {
            return res.status(200).json(cached);
        }

        const total = await prisma.order.count({
            where: {
                status: "completed",
            },
        });
        const payload = { total };
        await writeCachedJson(key, payload);
        res.status(200).json(payload);
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const totalrevenue = async (req, res) => {
    try {
        const key = cacheKey("revenue");
        const cached = await readCachedJson(key);
        if (cached) {
            return res.status(200).json(cached);
        }

        const total = await prisma.order.aggregate({
            _sum: {
                totalAmount: true,
            },
        });

        const totalRevenue = total._sum.totalAmount
            ? total._sum.totalAmount.toString()
            : "0.00";

        const payload = { total: totalRevenue };
        await writeCachedJson(key, payload);
        res.status(200).json(payload);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Internal server error" });
    }
};
