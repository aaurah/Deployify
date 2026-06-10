import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import deploymentsRouter from "./deployments";
import domainsRouter from "./domains";
import envVarsRouter from "./envvars";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(deploymentsRouter);
router.use(domainsRouter);
router.use(envVarsRouter);
router.use(dashboardRouter);
router.use(adminRouter);
router.use(aiRouter);

export default router;
