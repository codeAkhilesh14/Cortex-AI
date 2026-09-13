export const getCurrentUser = async (req, res) => {
    try {
        const user = req.user
        if(!user) {
            return res.status(404).json({ message: "User not found" })
        }
        return res.status(200).json(user)
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "Internal Server Error while fetching current user" })
    }
}