import api from "../../../../shared/services/api";
const assetService={
 getDashboard:()=>api.get("/assets/dashboard"), getOptions:()=>api.get("/assets/options"),
 getCategories:()=>api.get("/assets/categories"), createCategory:(p)=>api.post("/assets/categories",p), updateCategory:(id,p)=>api.put(`/assets/categories/${id}`,p),
 getAssets:(params={})=>api.get("/assets",{params}), createAsset:(p)=>api.post("/assets",p), updateAsset:(id,p)=>api.put(`/assets/${id}`,p), updateStatus:(id,is_active)=>api.patch(`/assets/${id}/status`,{is_active}),
 getMaintenances:(params={})=>api.get("/assets-maintenances",{params}), createMaintenance:(p)=>api.post("/assets-maintenances",p),
 getMutations:(params={})=>api.get("/asset-mutations",{params}), mutate:(id,p)=>api.post(`/assets/${id}/mutate`,p),
};
export default assetService;
