import { Router } from 'express';
import {
    createNewBlock,
    createNewFollow,
    getListFollowUsers,
    getListUsersFollow,
    getUserRelationship,
    handleUnBlock,
    handleUnfollow,
} from '../controllers/relationshipController';
import {
    validateCreateBlock,
    validateCreateFollow,
    validateGetUserRelationship,
    validateUnBlock,
    validateUnfollow,
} from '../validation/validateRelationship';
import { authenticate } from '../middlewares/auth';
import { authorize } from '../middlewares/authorize';

const router = Router();

router.get(
    "/following",
    authenticate,
    authorize('RELATIONSHIP_LIST_FOLLOWING'),
    getListFollowUsers,
);

router.get(
    "/followers",
    authenticate,
    authorize('RELATIONSHIP_LIST_FOLLOWERS'),
    getListUsersFollow,
);

router.get(
    "/:targetId", 
    authenticate,
    authorize('RELATIONSHIP_VIEW'),
    validateGetUserRelationship,
    getUserRelationship,
);

router.post(
    "/:targetId/follow",
    authenticate,
    authorize('RELATIONSHIP_FOLLOW'),
    validateCreateFollow,
    createNewFollow,
);

router.delete(
    "/:targetId/follow",
    authenticate,
    authorize('RELATIONSHIP_UNFOLLOW'),
    validateUnfollow,
    handleUnfollow,
);

router.post(
    "/:targetId/block",
    authenticate,
    authorize('RELATIONSHIP_BLOCK'),
    validateCreateBlock,
    createNewBlock,
);

router.delete(
    "/:targetId/block",
    authenticate,
    authorize('RELATIONSHIP_UNBLOCK'),
    validateUnBlock,
    handleUnBlock,
);

export default router;