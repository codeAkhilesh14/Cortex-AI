import axios from "axios"
import { signInternalRequest } from "../../../shared/internalAuth/internalAuth.js"

export const deductCredits = async (userId, agent) => {
    try {
        const payload = { userId, agent }
        const { timestamp, signature } = signInternalRequest(process.env.INTERNAL_SERVICE_SECRET, payload)
        const { data } = await axios.post(`${process.env.AUTH_SERVICE}/deduct-credits`, payload, {
            headers: {
                "x-internal-timestamp": timestamp,
                "x-internal-signature": signature
            }
        })
        return data
    } catch (error) {
        console.log(error)
        return null
    }
}
