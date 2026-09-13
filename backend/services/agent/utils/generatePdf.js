import PDFDocument from "pdfkit"

export const generatePdf = async (data) => {
    return new Promise((resolve, reject)=>{
        const doc = new PDFDocument({
            size: "A4",
            margin: 50,
            info: {
                Author: "CortexAI",
                Title: data.title,
                Creator: "CortexAI"
            }
        })
        const chunks = []
        doc.on("data", (chunk) => {
            chunks.push(chunk);
        });

        doc.on("end", () => {
            resolve(Buffer.concat(chunks));
        });

        doc.on("error", (err) => {
            reject(err);
        });

        //title
        doc
            .fillColor("#111827")
            .fontSize(28)
            .text(data.title, {
                align: "center"
            })

        // add space
        if(data.subtitle) {
            doc.moveDown(0.5)
        }    

        // subtitle
        doc
            .fillColor("#6B7280") 
            .fontSize(12)
            .text(data.subtitle, {
                align: "center"
            })   

        doc.moveDown(2)


        // sections
        data?.sections?.forEach(s => {
            doc
                .fillColor("#111827")
                .fontSize(18)
                .text(s.heading)
                
            doc.moveDown(0.5)
            
            //points
            s?.points?.forEach((p)=>{
                doc
                    .fillColor("#374151")
                    .fontSize(12)
                    .text("• "+p, {
                        lineGap: 5
                    })
            })

            doc.moveDown()
            
        })

        doc.moveDown()

        // footer
        doc
            .fillColor("#9CA3AF")
            .fontSize(10)
            .text("Generate By CortexAI", {
                align: "center"
            })

        doc.end()    
    })
}