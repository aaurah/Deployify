import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import deploymentsRouter from "./deployments";
import domainsRouter from "./domains";
import envVarsRouter from "./envvars";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(deploymentsRouter);
router.use(domainsRouter);
router.use(envVarsRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
