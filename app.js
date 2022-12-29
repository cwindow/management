const express = require('express')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const { closeDelimiter } = require('ejs');
var db = require('./connection.js');
//const bodyParser = require('body-parser');
require('dotenv').config()
const portNo=process.env.PORT || '5000'
// - - - - - - -- - - -  all libraries imported here- - -- - - - - - - - - -- - - - - - - - -- 


// hostName = 'localhost'
// dbname = 'u997094728_contentmanager'
// userName = 'root'
// password= ''


// hostName = 'sql6.freesqldatabase.com'
// dbname = 'sql6524945'
// userName = 'sql6524945'
// password = process.env.PASS_CLOUD_DB

let done = 'Status: Connect to Database'
const app = express()

app.set('view engine','ejs')
app.use(express.urlencoded({extended: false}))
app.use('/public', express.static('public'));
app.use(cookieParser())
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret:'secret',
    cookie:{maxAge: 60000}
}))

var auth = function(req, res, next){
    if(req.session && req.session.user)
        return next()
    else
        return res.sendStatus(401)
}

// var db = mysql.createConnection({
//     host: hostName,
//     user: userName,
//     password: password,
//     database: dbname,
//     connectTimeout:10000
//   });

    
//     db.connect((err) => {
//         if(err) {
//             console.log(err);
//             return;
//         }
//         console.log('My SQL Conneced for content database')
//         done = 'Status: Connected to Database'
//     })

/* *********************************************** */

app.get('/',(req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if(req.session.user){
        res.render('index',{done : done, user: req.session.user})
        console.log("client with ip: "+ip+" has connected to main page")

    }
    else{
        res.render('login',{message: "undefined"})
    }
})
// ---------------get request for the login page---------------------

function userData(username){
    let sql = `SELECT name, username, password FROM usermanagement WHERE username = '${username}'`
    //console.log(sql)
    return new Promise((resolve, reject) => {

        db.query(sql,(err, rows, fields)=>{
            if(!err){
                //console.log(rows);
                resolve(rows)
            }
            else{
                //res.render('errHandle',{results: "No Such Record Found", er: err})
                //const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                //console.log("error")
                reject("error")
            }
        })
        
    })

}

app.get('/login',(req, res) => {
    res.render('login',{message: "undefined"})
})
app.post('/loginUser',async(req, res) => {

    let userN = req.body.userName
    let password = req.body.password
    let userdata = await userData(userN)
    //console.log(usernName, '  ', password)
    //console.log(userdata)
    //console.log(userdata.length)
    if(userdata.length>0){
        
        //console.log(userdata[0].password)
        if(!userN  || !password)
            res.send("Login Failed")
        else{
            if(userN === userdata[0].username && password === userdata[0].password){
                req.session.user=userdata[0].name
                res.redirect('/')
            }
            else{
                res.render('login',{message: "Username or Password is incorrect"})
            }
        }
        
    }
    else{
        res.render('login',{message: "Username or Password is incorrect"})
    }
})

app.get('/successful',(req, res) => {
    res.render('conformation',{user: req.session.user})
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("client with ip: "+ip+" has connected to conformation page")
})

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.render('login',{message: "Logged Out"});
    
  });

app.post('/inserting', auth,async (req, res) => {
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
    
        let sql = 'INSERT INTO codewindowdb (topicName, link, category, companyName, languageSpecific, dateUploaded, uploadedBy, typeOfContent) VALUES (?)'
        let match = await bcrypt.compare(authPass,process.env.AUTH_HASH)
        console.log(match)
        if (match){
            try{

            
                db.query(sql, [posts],(err, result)=>{
                    if(!err && result.affectedRows>0) {
                        //console.log(sql)
                        console.log('Number of rows updated : ' + result.affectedRows)
                        res.redirect('successful')
                        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        console.log("client with ip: "+ip+" has inserted the data")
                    }
                    else{
                        res.render('errHandle',{results: "There has been a problem inserting the Data / No data Provided", er: err, user: req.session.user})
                        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                        console.log("client with ip: "+ip+" has inserted the data but with a error / no data provided")
                    }
                })
            }catch(e){
                res.render('errHandle',{results: "There has been a problem inserting the Data / No data Provided", er: e, user: req.session.user})
            } 
        }
        else{
            res.render('errHandle',{results: "Authentication Failed", er: 'Re-Authenticate', user: req.session.user})
        }

    })

app.post('/getpost', auth,(req, res) => {
    let tname = req.body.tn
    let cate = req.body.cat
    let company = req.body.com
    let language = req.body.lan
    let dateupload = req.body.dou
    let uploadedby = req.body.ub
    let content = req.body.toc

    var posts=[
        tname,
        cate,
        company,
        language,
        dateupload,
        uploadedby,
        content
    ]

    console.log(posts)
    let sql = 'SELECT * FROM codewindowdb WHERE topicName= ? OR category = ? OR companyName = ? OR languageSpecific = ? OR dateUploaded = ? OR uploadedBy= ? OR typeOfContent = ?'
    try{
    db.query(sql, [tname, cate, company, language, dateupload, uploadedby, content],(err, rows, fields)=>{
        if(!err && rows.length > 0){
            console.log(rows);
            let re=[]
            res.render('resultsPage',{results: re,rows: rows, user: req.session.user})
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log("client with ip: "+ip+" has retrived the data")

        }
        else{
            res.render('errHandle',{results: "No Such Record Found", er: err, user: req.session.user})
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log("client with ip: "+ip+" has retrived the data but with an no record error")
        }
    })
}catch(e){
    res.render('errHandle',{results: "There has been a problem inserting the Data / No data Provided", er: e, user: req.session.user})
}


})

function optionQuery(column){
    let sql = `SELECT ${column} FROM categorymanagement WHERE ${column} IS NOT NULL`
    //console.log(column)
    return new Promise((resolve, reject) => {

        db.query(sql,(err, rows, fields)=>{
            if(!err && rows.length > 0){
                //console.log(rows);
                resolve(rows)
            }
            else{
                //res.render('errHandle',{results: "No Such Record Found", er: err})
                //const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                //console.log("error")
                reject('error')
            }
        })
        
        
    })

}

app.get('/insertdata', auth,async(req, res) => {
    let authors = await optionQuery('authors')
    //console.log(authors)
    let category = await optionQuery('category')
    //console.log(category)
    let company = await optionQuery('company')
    //console.log(company)
    let language =await  optionQuery('language')
    //console.log(language)
    let type = await optionQuery('typeofcontent')
    //console.log(type)
    if(authors != 'error' &&
        category != 'error' &&
        company != 'error' &&
        language != 'error' && type != 'error'){
            res.render('_insert',{authors:authors, category: category, company: company, language: language, type: type, user: req.session.user})
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log("client with ip: "+ip+" has connected to database insert page")
        }
        else{
            res.render('errHandle',{results: "An error has occured", er: 'An error has occured Please check the data you are inserting', user: req.session.user})
            const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            console.log("client with ip: "+ip+" has retrived the data but with an no record error")
        }
})

app.get('/checkdata', auth,async(req, res) => {
    let authors = await optionQuery('authors')
    //console.log(authors)
    let category = await optionQuery('category')
    //console.log(category)
    let company = await optionQuery('company')
    //console.log(company)
    let language =await  optionQuery('language')
    //console.log(language)
    let type = await optionQuery('typeofcontent')
    //console.log(type)
    if(authors != 'error' &&
        category != 'error' &&
        company != 'error' &&
        language != 'error' && type != 'error'){    
        res.render('getdata',{authors:authors, category: category, company: company, language: language, type: type, user: req.session.user})
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log("client with ip: "+ip+" has connected to check page")
    }
    else{
        res.render('errHandle',{results: "An error has occured", er: 'An error has occured Please check the data you are inserting', user: req.session.user})
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        console.log("client with ip: "+ip+" has retrived the data but with an no record error")
    }
})

app.get('/sqlquery', auth,(req, res) => {
    res.render('sqlq',{user: req.session.user})
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("client with ip: "+ip+" has connected to check page")
})

function unacceptable(pwd){
    var unforgivable = [
        /drop/i,
        /droptable/i,
        /drop table/i,
        /drop database/i,
        /drop column/i,
        /alter/i,
        /alter table/i,
        /rename/i,
        /add/i,
        /insert/i,
        /change/i]
    for (var i=0; i<unforgivable.length; i++)
        if(pwd.match(unforgivable[i])) return true;
    return false;
} 

app.post('/sqlpost', auth,(req, res) => {
    let tname = req.body.tn
    console.log(tname)

    let sql = tname
    if(unacceptable(sql) == true){
        res.render('errHandle',{results: "You cant change Table, Authorization failure", er: 'error', user: req.session.user})
    }
    else{
        console.log('Inside Else block for drop authorization')
        try{
        db.query(sql,(err, rows, fields)=>{
            if(!err && rows.length > 0){
                console.log(rows);
                let re=[]
                res.render('resultsPage',{results: re,rows: rows, user: req.session.user})
                const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                console.log("client with ip: "+ip+" has retrived the data")
    
            }
            else{
                res.render('errHandle',{results: "No Such Record Found", er: err, user: req.session.user})
                const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                console.log("client with ip: "+ip+" has retrived the data but with an no record error")
            }
        })
    }catch(e){
        res.render('errHandle',{results: "There has been a problem inserting the Data / No data Provided", er: e, user: req.session.user})
    }

    }


})


function telequery(column){
    let sql = `SELECT ${column} FROM telegrampost`
    //console.log(column)
    return new Promise((resolve, reject) => {

        db.query(sql,(err, rows, fields)=>{
            if(!err && rows.length > 0){
                //console.log(rows);
                resolve(rows)
            }
            else{
                //res.render('errHandle',{results: "No Such Record Found", er: err})
                //const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
                //console.log("error")
                console.log('ERROORR')
                reject('error')
            }
        })
        
        
    })


}


app.post('/postTelegram',async(req, res) => {
    let company = req.body.com
    let link = req.body.ln
    let role = req.body.rol
    let ctc = req.body.ctc
    let batch = req.body.batch

    var posts=[
        company,
        link,
        role,
        ctc,
        batch
    ]

    console.log(posts)

    let firstpart = await telequery('startingpara')
    console.log(firstpart)
    let secondpart = await telequery('middlepara')
    console.log(secondpart)
    let lastpart = await telequery('bottompara')
    console.log(lastpart)
    
        if(posts.length > 0){
            res.render('resultTelegram',{result: posts, firstpart: firstpart, secondpart: secondpart, lastpart: lastpart, user: req.session.user})

        }
        else{
            res.render('errHandle',{results: "There is some error, please try again", er:'Failure', user: req.session.user})
        }

})

app.get('/createTelegramPost', auth,(req, res)=>{
    res.render('getTelePostData',{user: req.session.user})
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log("client with ip: "+ip+" has connected to Telegram page")
})

app.listen(portNo,()=>{
    console.log(`Listening on port ${portNo}`)
    console.log("session for: ",req.session.user)

});