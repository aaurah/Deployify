import { Router, type IRouter } from "express";
import healthRouter from "./health";
import projectsRouter from "./projects";
import deploymentsRouter from "./deployments";
import domainsRouter from "./domains";
import envVarsRouter from "./envvars";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(projectsRouter);
router.use(deploymentsRouter);
router.use(domainsRouter);
router.use(envVarsRouter);
router.use(dashboardRouter);

export default router;
