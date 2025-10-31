import express, { response, request } from 'express';
import { db } from '../config/db.js';
import { incomes, losses, users } from '../db/schema.js';
import { eq, ne } from 'drizzle-orm';
import cloudinary from '../utils/cloudaniry.js';
import { getPublicIdFromUrl } from '../utils/getPublicIdFromUrl.js';
export const create_user = async (request, response) => {
    try {
        const { clerkId, name, email, money, profile_picture } = request.body;

        if (!clerkId || !name || !email || !money || !profile_picture) {
            return response.status(400).json({
                error: 'All fields are required!!'
            });
        }
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);
        if (existingUser.length > 0) {
            return response.status(200).json({
                message: 'User already exists',
                user: existingUser[0]
            });
        }
        const newUser = await db.insert(users).values({
            clerkId,
            name,
            email,
            money,
            profile_picture,
        }).returning();

        return response.status(201).json({
            message: 'User created successfully',
            user: newUser[0]
        });
    } catch (error) {
        console.error("Create user error:", error);
        return response.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
};
export const update_user = async (request, response) => {
    try {
        const { clerkId } = request.params;
        const { name, money, profile_picture } = request.body;
        if (!clerkId) {
            return response.status(400).json({
                error: 'clerkId is required!!',
            });
        }
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);
        if (existingUser.length === 0) {
            return response.status(404).json({
                error: 'User not found!!',
            });
        }
        const updateData = {};
        if (name) updateData.name = name;
        if (money !== undefined) updateData.money = money;
        if (profile_picture) updateData.profile_picture = profile_picture;
        if (Object.keys(updateData).length === 0) {
            return response.status(400).json({
                error: 'No valid fields to update!!',
            });
        }
        const updatedUser = await db.update(users)
            .set(updateData)
            .where(eq(users.clerkId, clerkId))
            .returning();
        return response.status(200).json({
            message: 'Updated successfully!!',
            user: updatedUser[0]
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};
export const delete_user = async (request, response) => {
    try {
        const { clerkId } = request.params;
        if (!clerkId) {
            return response.status(400).json({
                error: 'clerkId is required!!',
            });
        }
        const deletedUser = await db.delete(users)
            .where(eq(users.clerkId, clerkId))
            .returning();
        if (deletedUser.length > 0) {
            return response.status(200).json({
                message: 'User deleted successfully!!',
                user: deletedUser[0]
            });
        }
        return response.status(404).json({
            error: 'User not found!!',
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};
export const get_user = async (request, response) => {
    try {
        const { clerkId } = request.params;
        if (!clerkId) {
            return response.status(400).json({
                error: 'clerkId is required!!',
            });
        }
        const existingUser = await db.select()
            .from(users)
            .where(eq(users.clerkId, clerkId))
            .limit(1);
        if (existingUser.length > 0) {
            return response.status(200).json({
                message: 'User found',
                user: existingUser[0]
            });
        }
        return response.status(404).json({
            error: 'User not found!!',
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};
export const get_incomes = async (request, response) => {
    try {
        const { userId } = request.params;
        if (!userId) {
            return response.status(400).json({
                error: 'userId is required!!'
            });
        }
        const user_incomes = await db.select()
            .from(incomes)
            .where(eq(incomes.user_id, parseInt(userId)))
            .orderBy(incomes.created_at);

        return response.status(200).json({
            user_incomes
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};
export const get_losses = async (request, response) => {
    try {
        const { userId } = request.params;
        if (!userId) {
            return response.status(400).json({
                error: 'userId is required!!'
            });
        }
        const user_losses = await db.select()
            .from(losses)
            .where(eq(losses.user_id, parseInt(userId)))
            .orderBy(losses.created_at);

        return response.status(200).json({
            user_losses
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        });
    }
};
export const getUsers = async (request, response) => {
    const { userId } = request.params;
    try {
        const all_users = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            profile_picture: users.profile_picture
        }).from(users).where(ne(users.id, userId));
        return response.status(200).json({
            users: all_users
        });
    } catch (error) {
        return response.status(500).json({
            error: error instanceof Error ? error.message : error
        })
    }
};
export const editProfilePicture = async (request, response) => {
    try {
        const new_profile_picture = request.file;
        const { userId } = request.params;

        if (!new_profile_picture) {
            return response.status(400).json({
                error: 'Profile picture is required!!'
            });
        }
        if (!userId) {
            return response.status(400).json({
                error: 'userId is required!!'
            });
        }
        const user = await db.select({
            id: users.id,
            profile_picture: users.profile_picture
        }).from(users).where(eq(users.id, parseInt(userId)));

        if (user.length === 0) {
            return response.status(404).json({
                error: 'User not found!!'
            });
        }
        if (user[0].profile_picture) {
            const publicId = getPublicIdFromUrl(user[0].profile_picture, 'users');
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.warn('Failed to delete old image from Cloudinary:', cloudinaryError);
                }
            }
        }
        const base64Image = `data:${new_profile_picture.mimetype};base64,${new_profile_picture.buffer.toString('base64')}`;
        const uploadResult = await cloudinary.uploader.upload(base64Image, {
            folder: 'users',
            resource_type: 'image',
            transformation: [
                { width: 500, height: 500, crop: 'limit' },
                { quality: 'auto' }
            ]
        });
        const updatedUser = await db.update(users).set({
            profile_picture: uploadResult.secure_url,
        }).where(eq(users.id, parseInt(userId))).returning();
        return response.status(200).json({
            message: 'Profile picture updated successfully!!',
            user: updatedUser[0]
        });
    } catch (error) {
        console.error('Error in editProfilePicture:', error);
        return response.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}