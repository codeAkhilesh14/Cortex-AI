import api from "../../utils/axios"

export const createOrder = async (plan) => {
    try {
        const { data } = await api.post("/api/billing/create", {plan})
        console.log("createOrder data:", data)
        return data
    } catch (error) {
        return []
    }
}