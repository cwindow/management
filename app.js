const express = require('express')
const mysql = require('mysql');
//const bodyParser = require('body-parser');
require('dotenv').config()

hostName = 'sql6.freesqldatabase.com'
dbname = 'sql6524945'
userName = 'sql6524945'

var db = mysql.createConnection({
    host: hostName,
    user: userName,
    password: process.env.PASS_CLOUD_DB,
    database: dbname
  });

db.connect((err) => {
    if(err) throw err
    console.log('My SQL Conneced')
})

const app = express()

app.set('view engine','ejs')
app.use(express.urlencoded({extended: false}))
app.use('/public', express.static('public'));

/* *********************************************** */

app.get('/',(req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    res.render('index')
    console.log("client with ip: "+ip+" has connected to main page")
})

app.get('/successful',(req, res) => {
    res.render('conformation')
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("client with ip: "+ip+" has connected to conformation page")
})

app.post('/inserting',(req, res) => {
        let tname = req.body.tn
        let lname = req.body.ln
        let cate = req.body.cat
        let company = req.body.com
        let language = req.body.lan
        let dateupload = req.body.dou
        let uploadedby = req.body.ub
        let content = req.body.toc
        let authPass = req.body.pap
        //console.log(tname)
        //console.log(cate)

        var posts=[
            tname, 
            lname, 
            cate, 
            company, 
            language, 
            dateupload, 
            uploadedby, 
            content
        ]
    
        //let sql = `INSERT INTO codewindowdb (topicName, link, category, companyName, languageSpecific, dateUploaded, uploadedBy, typeOfContent) VALUES ('${tname}','${lname}','${cate}','${company}','${language}','${dateupload}','${uploadedby}','${content}') `
        let sql = 'INSERT INTO codewindowdb2 (topicName, link, category, companyName, languageSpecific, dateUploaded, uploadedBy, typeOfContent) VALUES (?)'
        if (authPass === process.env.AUTH){

            db.query(sql, [posts],(err, result)=>{
                if(!err && result.affectedRows>0) {
                    //console.log(sql)
                    console.log('Number of rows updated : ' + result.affectedRows)
                    res.redirect('successful')
                    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    console.log("client with ip: "+ip+" has inserted the data")
                }
                else{
                    res.render('errHandle',{results: "There has been a problem inserting the Data / No data Provided", er: err})
                    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                    console.log("client with ip: "+ip+" has inserted the data but with a error / no data provided")
                }
            })
        }
        else{
            res.render('errHandle',{results: "Authentication Failed", er: 'Re-Authenticate'})
        }


})

app.post('/getpost',(req, res) => {
    let tname = req.body.tn
    let cate = req.body.cat
    let company = req.body.com
    let language = req.body.lan
    let dateupload = req.body.dou
    let uploadedby = req.body.ub
    let content = req.body.toc
    //console.log(tname)
    //console.log(cate)

    var posts=[
        tname,
        cate,
        company,
        language,
        dateupload,
        uploadedby,
        content
    ]

    //let sql = `INSERT INTO codewindowdb (topicName, link, category, companyName, languageSpecific, dateUploaded, uploadedBy, typeOfContent) VALUES ('${tname}','${lname}','${cate}','${company}','${language}','${dateupload}','${uploadedby}','${content}') `
    console.log(posts)
    let sql = 'SELECT * FROM codewindowdb2 WHERE topicName= ? OR category = ? OR companyName = ? OR languageSpecific = ? OR dateUploaded = ? OR uploadedBy= ? OR typeOfContent = ?'
    db.query(sql, [tname, cate, company, language, dateupload, uploadedby, content],(err, rows, fields)=>{
        if(!err && rows.length > 0){
            console.log(rows);
            let re=[]
            //console.log(final[0].topicName)
            //console.log(rows[0].topicName)
            res.render('resultsPage',{results: re,rows: rows})
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log("client with ip: "+ip+" has retrived the data")

        }
        else{
            res.render('errHandle',{results: "No Such Record Found", er: err})
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log("client with ip: "+ip+" has retrived the data but with an no record error")
        }
    })


})

app.get('/insertdata',(req, res) => {
    res.render('_insert')
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("client with ip: "+ip+" has connected to database insert page")
})

app.get('/checkdata',(req, res) => {
    res.render('getdata')
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("client with ip: "+ip+" has connected to check page")
})

app.post('/postTelegram',(req, res) => {
    let company = req.body.com
    let link = req.body.ln
    let role = req.body.rol
    let ctc = req.body.ctc
    let batch = req.body.batch
    //console.log(tname)
    //console.log(cate)

    var posts=[
        company,
        link,
        role,
        ctc,
        batch
    ]

    //let sql = `INSERT INTO codewindowdb (topicName, link, category, companyName, languageSpecific, dateUploaded, uploadedBy, typeOfContent) VALUES ('${tname}','${lname}','${cate}','${company}','${language}','${dateupload}','${uploadedby}','${content}') `
    console.log(posts)
    
        if(posts.length > 0){
            res.render('resultTelegram',{result: posts})

        }
        else{
            res.render('errHandle',{results: "There is some error, please try again", er:'Failure'})
        }
    


})

app.get('/createTelegramPost',(req, res)=>{
    res.render('getTelePostData')
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("client with ip: "+ip+" has connected to Telegram page")
})
portNo=process.env.PORT || '5000'
app.listen(portNo,()=>{
    console.log(`Listening on port ${portNo}`)
});