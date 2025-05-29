import prisma from '../config/db.config.js'

export const totalusers = async (req, res) => {
    try{
        const total = await prisma.user.count({
            where:{
                isAdmin: false
            }
        })
        res.status(200).json({total})
    }
    catch(e){
        console.log(e)
        res.status(500).json({error: "Internal server error"})
    }
}

export const totalorders = async (req, res) => {
    try{
        const total = await prisma.order.count()
        res.status(200).json({total})
    }catch(e){
        console.log(e)
        res.status(500).json({error: "Internal server error"})
    }
}
export const totalpendingorders = async (req, res) => {
    try{
        const total = await prisma.order.count({
            where: {
                status: "pending"
            }
        })
        res.status(200).json({total})
    }catch(e){
        console.log(e)
        res.status(500).json({error: "Internal server error"})
    }
}
export const totalcompletedorders = async (req, res) => {
    try{
        const total = await prisma.order.count({
            where: {
                status: "completed"
            }
    }
)}catch(e){
        console.log(e)
        res.status(500).json({error: "Internal server error"})
    
}
}

export const totalrevenue = async (req, res) => {
    try{
        const total = await prisma.order.aggregate({
            _sum: {
                totalPrice: true
            }
        })
        res.status(200).json({total: total._sum.totalPrice})
    }
    catch(e){
        console.log(e)
        res.status(500).json({error: "Internal server error"})
    }
}