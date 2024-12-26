import express from "express";
import locationController from "../controllers/location.controller";
const locationRouter = express.Router();

locationRouter.get('/regions' , locationController.getRegions);
locationRouter.get('/wards', locationController.getWards);

export default locationRouter;
