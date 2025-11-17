import { Router } from 'express';
import {
    createNewBlock,
    createNewFollow,
    getListFollowUsers,
    getListUsersFollow,
    getUserRelationship,
    handleUnfollow,
} from '../controllers/relationshipController';
import {
    validateCreateBlock,
    validateCreateFollow,
    validateGetUserRelationship,
    validateUnfollow,
} from '../validation/validateRelationship';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get(
    "/following",
    authenticate,
    authorize('USER_LIST_FOLLOWING'),
    getListFollowUsers,
);

router.get(
    "/followers",
    authenticate,
    authorize('USER_LIST_FOLLOWERS'),
    getListUsersFollow,
);

router.get(
    "/:targetId", 
    authenticate,
    authorize('USER_VIEW_RELATIONSHIP'),
    validateGetUserRelationship,
    getUserRelationship,
);

router.post(
    "/:targetId/follow",
    authenticate,
    authorize('USER_CREATE_FOLLOW'),
    validateCreateFollow,
    createNewFollow,
);

router.delete(
    "/:targetId/follow",
    authenticate,
    authorize('USER_UNFOLLOW'),
    validateUnfollow,
    handleUnfollow,
);

router.post(
    "/:targetId/block",
    authenticate,
    authorize('USER_CREATE_BLOCK'),
    validateCreateBlock,
    createNewBlock,
);

export default router;