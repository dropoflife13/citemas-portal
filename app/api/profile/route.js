import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { requireFreshUser } from '@/lib/permissions';
import { profilePatchSchema } from '@/lib/validators';
import { logActivity } from '@/lib/logActivity';

export async function GET(req) {
  try {
    const { decoded, error, status } = await requireFreshUser(req);
    if (error) {
      return NextResponse.json({ message: error }, { status });
    }

    await dbConnect();

    const userId = decoded.id || decoded._id;
    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found in database' }, { status: 404 });
    }

    const existingImages = Array.isArray(user.portfolioImages) ? user.portfolioImages : [];

    return NextResponse.json(
      {
        user: {
          ...user,
          portfolioImages: existingImages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('CRITICAL /api/profile GET Error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    const { decoded, error, status } = await requireFreshUser(req);
    if (error) {
      return NextResponse.json({ message: error }, { status });
    }

    const authResult = { user: decoded };
    await dbConnect();

    const body = await req.json();
    const parsed = profilePatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message || 'Invalid profile payload' },
        { status: 400 }
      );
    }

    const {
      firstName,
      lastName,
      phone,
      bio,
      avatar,
      coverPhoto,
      portfolioImages,
      yearLevel,
      department,
      specialization,
    } = parsed.data;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (phone !== undefined) updates.phone = phone.trim();
    if (bio !== undefined) updates.bio = bio.trim();
    const isSafeMediaUrl = (u) => u === '' || /^https:\/\//i.test(u) || u.startsWith('/');
    if (avatar !== undefined) {
      const trimmedAvatar = avatar.trim();
      if (!isSafeMediaUrl(trimmedAvatar)) {
        return NextResponse.json({ message: 'Avatar URL must use https:// or a relative path' }, { status: 400 });
      }
      updates.avatar = trimmedAvatar;
    }
    if (coverPhoto !== undefined) {
      const trimmedCover = coverPhoto.trim();
      if (!isSafeMediaUrl(trimmedCover)) {
        return NextResponse.json({ message: 'Cover photo URL must use https:// or a relative path' }, { status: 400 });
      }
      updates.coverPhoto = trimmedCover;
    }
    if (Array.isArray(portfolioImages)) {
      updates.portfolioImages = portfolioImages
        .filter((url) => typeof url === 'string' && url.trim().length > 0)
        .map((url) => url.trim());
    }
    if (yearLevel !== undefined) updates.yearLevel = yearLevel.trim();
    if (department !== undefined) updates.department = department.trim();
    if (specialization !== undefined) updates.specialization = specialization.trim();

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No valid profile fields were provided' }, { status: 400 });
    }

    const userId = authResult.user.id || authResult.user._id;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password')
      .lean();

    if (!updatedUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // ─── Log the activity ───
    const actor = {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      role: updatedUser.role,
    };
    const actorName = `${updatedUser.firstName} ${updatedUser.lastName}`;

    if (avatar !== undefined) {
      await logActivity({
        req,
        actor,
        action: 'profile.avatar_changed',
        targetType: 'User',
        targetId: updatedUser._id,
        targetName: actorName,
      });
    }

    if (coverPhoto !== undefined) {
      await logActivity({
        req,
        actor,
        action: 'profile.cover_changed',
        targetType: 'User',
        targetId: updatedUser._id,
        targetName: actorName,
      });
    }

    // Log the general "profile updated" for non-image changes
    const nonImageUpdates = Object.keys(updates).filter(
      (k) => k !== 'avatar' && k !== 'coverPhoto'
    );
    if (nonImageUpdates.length > 0) {
      await logActivity({
        req,
        actor,
        action: 'profile.updated',
        targetType: 'User',
        targetId: updatedUser._id,
        targetName: actorName,
        metadata: { fields: nonImageUpdates },
      });
    }

    return NextResponse.json(
      { message: 'Profile updated successfully', user: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('CRITICAL /api/profile PATCH Error:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  return PATCH(req);
}
