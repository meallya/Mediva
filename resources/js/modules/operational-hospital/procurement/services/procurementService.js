import api from "../../../../shared/services/api";
const procurementService={
 getDashboard:()=>api.get("/procurement/dashboard"), getOptions:()=>api.get("/procurement/options"),
 getRequests:(params={})=>api.get("/procurement/requests",{params}), createRequest:(p)=>api.post("/procurement/requests",p), approve:(id)=>api.patch(`/procurement/requests/${id}/approve`,{}), reject:(id,reason)=>api.patch(`/procurement/requests/${id}/reject`,{reason}),
 getQuotations:(params={})=>api.get("/procurement/quotations",{params}), createQuotation:(p)=>api.post("/procurement/quotations",p), selectQuotation:(id)=>api.post(`/procurement/quotations/${id}/select`,{}),
 getOrders:(params={})=>api.get("/procurement/orders",{params}), issueOrder:(id,p={})=>api.patch(`/procurement/orders/${id}/issue`,p), receive:(id,p)=>api.post(`/procurement/orders/${id}/receive`,p), getReceipts:(params={})=>api.get("/procurement/receipts",{params}),
};
export default procurementService;
