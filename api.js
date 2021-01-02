const express = require('express');
const fs = require('fs')
var bodyParser = require('body-parser');
var exec = require('child_process').exec;
var mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const util = require('util');
const vm = require('vm');
const jwt = require('jsonwebtoken')


var connection = mysql.createConnection({
  //properties...
  host:'localhost',
  user: 'viraj',
  password: '4sarojini',
  database: 'mydatabase'

})

connection.connect(function(error){
  if(!!error){
    console.log('error')
  }
  else{
    console.log('connected')
  }

});

var classCodes = ["0"];
var students = [];
var teachers = [];

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', express.static('/ace-builds-master/src-noconflict'));

app.use(function(request,response,next){
  response.header("Access-Control-Allow-Origin", '*')
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization")
  next();
});

// app.get('/', (req, res) => {
//   res.sendFile('welcome.html', {root: __dirname })
//   // res.send('Hello World!')

//   // res.sendfile("index.html")
// });

app.post('/exec', function(req, res) {
  // var cmd = req.body.command;
  var code = req.body.code;
  var language = req.body.lang;
  var name ='viraj'

  if(language === "Javascript"){ 
    fs.writeFile('test.js', code + 'console.log(test())', function (err) {
      if (err) throw err;
    }); 


    

    exec("node " + name + "/test.js", function(error, stdout, stderr) {
      if (stderr || error) {
        
        res.send(stderr || error)
        // res.json({
        //   success: false,
        //   error: stderr || error,
        //   command: cmd,
        //   result: null
        // })
      } else {
        console.log(stdout);
        res.send(stdout)
        // res.json({
        //   success: true,
        //   error: null,
        //   command: cmd,
        //   result: stdout
        // })
      }
    })

    exec("mv ~/server/test.js ~/server/" + name)

  }
  else{
    fs.writeFile('file.py', code, function (err) {
      if (err) throw err;
    });

    exec("python3 file.py", function(error, stdout, stderr) {
      if (stderr || error) {
        
        res.send(stderr || error)
        // res.json({
        //   success: false,
        //   error: stderr || error,
        //   command: cmd,
        //   result: null
        // })
      } else {
        console.log(stdout);
        res.send(stdout)
        // res.json({
        //   success: true,
        //   error: null,
        //   command: cmd,
        //   result: stdout
        // })
      }
    })
  }



})



app.post('/createstudent',function(req,res){
  var class_code=req.body.code;
  var user_name=req.body.user_name;
  var password=req.body.password;
  var first = req.body.first;
  var last = req.body.last;
  var email = req.body.email;

  let hash = bcrypt.hashSync(password, 10);
  connection.query(`INSERT INTO students VALUES("${user_name}","none","${hash}","${first}","${last}","${email}")`, function(error, rows, fields){
    if(!!error){
      console.log('Error in the query');
      console.log(error);
    }
    else{
      console.log('successful query');
      connection.query('create table ' + user_name + '(name varchar(255) not null, preC text(65535) not null, postC text(65535) not null, exIn varchar(255) not null, exOut varchar(255) not null, testIn varchar(255) not null, testOut varchar(255) not null, language varchar(20) not null, initialCode text(65535) not null, date varchar(50) not null, progress varchar(50) not null default "Not Started", attempts int default 0, time_posted datetime default CURRENT_TIMESTAMP(), admin varchar(100));', function(error, rows, fields){
        if(!!error){
          res.send('Error in the create class table query');
          console.log(error);
        }
        else{
          res.send('successful query');
        
        }
      
      
      });



    }
  
  
  });

  console.log("User Name = " + user_name + ", password is " + password +", code is " + class_code);
  // if(validCode){
  //   exec("mkdir " + user_name)
  //   res.end("valid")
  //   students.push({u:user_name, p:password, c:class_code});
  // }
  // else{
  //   res.end("invalid")
  // }
});

app.post('/studentsignin', function(req,res){

  var user_name=req.body.user;
  var password=req.body.password;
  // var user_name=req.body.user;
  // var password=req.body.password;
  
  var matched = false;

  var correctPass=''

  connection.query('SELECT * FROM students WHERE username="'+user_name+'";', (err,answer) => {
    if(err) throw err;
    if(answer.length == 1){
      connection.query('SELECT password FROM students WHERE username="'+user_name+'";', (err,pword) => {
        if(err) throw err;
        
        correctPass = pword[0].password;
        // let hash = bcrypt.hashSync(password, 10);
        // `console.log(hash)
        if(bcrypt.compareSync(password, correctPass)) {
          // res.end('signed in')
          const user = {
            username:user_name
          }
    
          jwt.sign({user:user}, 'secretkey', (err,token) => {
              res.json({
                token: token,           
              })
          })
         } else {
              res.json({
                token:"incorrect"
              })
         }
      });

    }
    else{
      res.json({
        token:"incorrect"
      })
    }

  })
  


});

app.post('/createteacher',function(req,res){
  var user_name=req.body.user_name;
  var password=req.body.password;
  var first = req.body.first;
  var last = req.body.last;
  var email = req.body.email;
  var class_code;
  class_code = parseInt(classCodes[classCodes.length-1]) + 1
  class_code = class_code.toString();

  let hash = bcrypt.hashSync(password, 10);
  connection.query(`INSERT INTO teachers VALUES("${user_name}","${hash}","${first}","${last}","${email}")`, function(error, rows, fields){
    if(!!error){
      res.send('Error in the query');
      console.log(error);
    }
    else{
      res.send('successful query');
    }
  
  
  });
  console.log("User Name = " + user_name + ", password is " + password +", code is " + class_code);
  // res.send("test")
  
});

app.post('/teachersignin',function(req,res){
  var user_name=req.body.user;
  var password=req.body.password;
  
  connection.query('SELECT * FROM teachers WHERE username="'+user_name+'";', (err,answer) => {
    if(err) throw err;
    if(answer.length == 1){
      connection.query('SELECT password FROM teachers WHERE username="'+user_name+'";', (err,pword) => {
        if(err) throw err;
        
        correctPass = pword[0].password;
        // let hash = bcrypt.hashSync(password, 10);
        // `console.log(hash)
        if(bcrypt.compareSync(password, correctPass)) {
          // res.end('signed in')
          const user = {
            username:user_name
          }
    
          jwt.sign({user:user}, 'secretkey', (err,token) => {
              res.json({
                token: token,           
              })
          })
         } else {
              res.json({
                token:"incorrect"
              })
         }
      });

    }
    else{
      res.json({
        token:"incorrect"
      })
    }

  })
});

// app.post('/getstudents',function(req,res){
//   var user_name=req.body.user;
//   var classcode;
//   for(i=0;i<teachers.length;i++){
//     if (teachers[i].u === user_name){
//       classcode = teachers[i].c;
//     }
//     break;
//   }

//   var tempStudents = []

//   for(i=0;i<students.length;i++){
//     if(students[i].c === classcode){
//         tempStudents.push(students[i].u)
//     }
//   }

//   var tempRes = ""

//   for(i=0;i<tempStudents.length;i++){
//     if(i!== tempStudents.length-1){
//       tempRes= tempRes + tempStudents[i] + ","
//     }
//     else{
//       tempRes = tempRes + tempStudents[i]
//     }
//   }
  
//   res.end(tempRes)

// });

app.post('/execTeacherCode', function(req, res) {
  var code = req.body.code;
  var functionCall = req.body.functionCall;
  // var language = req.body.lang; 

    fs.writeFile('teacher.js', code+functionCall, function (err) {
      if (err) throw err;
    }); 
    

    exec("node teacher.js", function(error, stdout, stderr) {
      if (stderr || error) {
        // res.json({
        //   success: false,
        //   error: stderr.substring(stderr.indexOf('Error:'), stderr.indexOf('at')),
        //   result: stderr 
        // })
        // console.log(stderr)
        res.send(stderr.substring(stderr.indexOf('Error:'), stderr.indexOf('at')))
      } else {
        console.log(stdout);
        res.send(stdout)
        // res.json({
        //   success: true,
        //   error: null,
        //   result: stdout
        // })
      }
    })



});

app.post('/execStudentCode',verifyToken, function(req, res) {
  var code = req.body.code;
  // var functionCall = req.body.functionCall;
  // var admin=req.body.admin;
  var aName = req.body.aName;

  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`SELECT testIn,testOut from ${authData.user.username} WHERE name='${aName}'`, (err,test) => {
        if(err) throw err;

        //could use .join???
        var x=test[0].testIn.split('$$,')
        var temp = x.join(',,').split('@@,')
        var tIn=[]
        for(i=0;i<temp.length;i++){
          tIn.push(temp[i].split(',,'))
        }
        // console.log(tIn)

        var tOut=test[0].testOut.split('$$,')
        console.log(tOut)
        // var functionCall = `for(i=0;i<${tIn.length};i++){for(j=0;j<${tIn[0].length};j++){console.log(myFunction(${tIn[i][j]},${tIn[i][j]}))}}`
        // var language = req.body.lang; 

        var script=""
        for(i=0;i<tIn[0].length;i++){
          script+="console.log(myFunction("
          for(j=0;j<tIn.length;j++){
            script+= tIn[j][i]
            if(j<tIn.length-1){
              script+=','
            }
          }
          script+='));'
        }
        // console.log(script)

          fs.writeFile('student.js', code+script, function (err) {
            if (err) throw err;
          }); 
          

          exec("node student.js", function(error, stdout, stderr) {
            if (stderr || error) {
              // console.log(stderr)
              res.send(stderr.substring(stderr.indexOf('Error:'), stderr.indexOf('at')))
              
              // res.json({
              //   success: false,
              //   error: stderr || error,
              //   result: stderr 
              // })
            } else {
              var outputArr=[]
              var split=stdout.split('\n');
              for(i=0;i<split.length-1;i++){
                outputArr.push(split[i])
              }
              console.log(outputArr)
              if(JSON.stringify(tOut)== JSON.stringify(outputArr)){
                res.send('Correct')
              }
              else{
                res.send('Incorrect')
              }
              // res.send(outputArr)
              
              // res.json({
              //   success: true,
              //   error: null,
              //   result: stdout
              // })
            }
          })
      })
      
    
      
    }
  
  })



});

app.get('/getUser',verifyToken,function(req, res) {
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`SELECT first FROM students WHERE username='${authData.user.username}';`, (err,name) => {
        if(err) throw err;
        res.send(name[0].first)
      })
    }
  });

    
});

app.get('/getTeacherUser',verifyToken,function(req, res) {
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`SELECT first FROM teachers WHERE username='${authData.user.username}';`, (err,name) => {
        if(err) throw err;
        res.send(name[0].first)
      })
    }
  });

    
});

app.post('/inProgress',verifyToken,function(req, res) {
  var aName = req.body.aName;
  

  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`UPDATE ${authData.user.username} set progress='In Progress' WHERE name='${aName}'`, (err,data) => {
        if(err) throw err;
        res.send('Success')
      })
    }
  });

    
});

app.post('/setComplete',verifyToken, function(req, res) {
  var aName = req.body.aName;
  

  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`UPDATE ${authData.user.username} set progress='Complete' WHERE name='${aName}'`, (err,data) => {
    if(err) throw err;
    res.send('Success')
      })
    }
  });
})

app.post('/addAttempt',verifyToken, function(req, res){
  var aName = req.body.aName;
  
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`UPDATE ${authData.user.username} set attempts=attempts+1 WHERE name='${aName}'`, (err,data) => {
        if(err) throw err;
        res.send('Success')
      })
      
    }
  })
})



app.post('/postTeacherAssignment', verifyToken, function(req, res) {
  // var className = req.body.className;
  var assignmentName = req.body.assignmentName;
  var preC = req.body.preC;
  var postC = req.body.postC;
  var exIn = req.body.exInput;
  var exOut = req.body.exOutput;
  var testIn = req.body.testInput;
  var testOut = req.body.testOutput;
  var language = req.body.lang;
  var initialCode = req.body.code;
  var date = req.body.date;
  // var progress = req.body.progress;
  let students = req.body.students;
  let studentsList = students.split(',')
  // console.log(students);
  // console.log(studentsList);
  // console.log(testOut)
  

  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{

      //CONVERTS 2D ARRAY SENT FROM CLIENT TO A PARSABLE STRING TO SEND TO DATABASE
      var exampleIn=''
      for(i=0;i<exIn.length;i++){
        for(j=0;j<exIn[i].length;j++){
          exampleIn+=exIn[i][j]
          if(j<exIn[i].length-1){
            exampleIn+="$$,"
          }
        }
        if(i<exIn.length-1){
          exampleIn+="@@,"
        }
      }
      // console.log(exampleIn)

      var exampleOut=''
      for(i=0;i<exOut.length;i++){
        exampleOut+=exOut[i]
        if(i<exOut.length-1){
          exampleOut+='$$,'
        }
      }
      // console.log(exampleOut);

      var testInput=''
      for(i=0;i<testIn.length;i++){
        for(j=0;j<testIn[i].length;j++){
          testInput+=testIn[i][j]
          if(j<testIn[i].length-1){
            testInput+="$$,"
          }
        }
        if(i<testIn.length-1){
          testInput+="@@,"
        }
      }
      // console.log(testInput)

      var testOutput=''
      for(i=0;i<testOut.length;i++){
        testOutput+=testOut[i]
        if(i<testOut.length-1){
          testOutput+='$$,'
        }
      }
      // console.log(testOutput)
      // console.log(testInput.split(''))
      // console.log(testOutput.split(''))

      var arr1=exampleIn.split('')
      var arr2=exampleOut.split('')
      var arr3=testInput.split('')
      var arr4=testOutput.split('')

      for(i=0;i<arr1.length;i++){
        if(arr1[i]=="\"" || arr1[i]=="\'"){
          arr1[i] = "\\" + arr1[i]
        }
      }

      for(i=0;i<arr2.length;i++){
        if(arr2[i]=="\"" || arr2[i]=="\'"){
          arr2[i] = "\\" + arr2[i]
        }
      }

      for(i=0;i<arr3.length;i++){
        if(arr3[i]=="\"" || arr3[i]=="\'"){
          arr3[i] = "\\" + arr3[i]
        }
      }
      
      for(i=0;i<arr4.length;i++){
        if(arr4[i]=="\"" || arr4[i]=="\'"){
          arr4[i] = "\\" + arr4[i]
        }
      }

      exampleIn = arr1.join("");
      exampleOut = arr2.join("");
      testInput = arr3.join("");
      testOutput = arr4.join("");

      // console.log(arr1)
      // console.log(exampleIn)
      

      //CONVERTS THE PARSABLE STRING FROM DATABASE BACK INTO ORIGINAL 2D ARRAY TO SEND TO CLIENT. USE IN /GETASSIGNMENTDATA
      // var x=exampleIn.split('$$,')
      // var temp = x.toString().split('@@,')
      // var arr=[]
      // for(i=0;i<temp.length;i++){
      //   arr.push(temp[i].split(','))
      // }
      // console.log(arr)

      // connection.query(`UPDATE ${authData.user.username} set attempts=attempts+1 WHERE name='${aName}'`, (err,data) => {
      //   if(err) throw err;
      //   res.send('Success')
      // })
        
      
      
        for(i=0;i<studentsList.length;i++){
          
          connection.query('INSERT INTO ' + studentsList[i] +  ' VALUES( "'+ assignmentName +'","' + preC + '","' + postC +'","' + exampleIn +'","' + exampleOut +'","' + testInput +'","' + testOutput +'","' + language +'","' + initialCode +'","' + date +'", default, default, default, "' + authData.user.username +'")', function(error, rows){
            if(!!error){
              // console.log(error)
              // res.send(error)
            }
            else{
              // console.log('INSERT INTO ' + studentsList[i] +  ' VALUES( "'+ assignmentName +'","' + preC + '","' + postC +'","' + exIn +'","' + exOut +'","' + testIn +'","' + testOut +'","' + language +'","' + initialCode +'","' + date +'", default, default, default, "' + authData.user.username +'")')
              // res.send('Successful query. Added assignment to every student')
            }
          
          });
        }
  
        res.send('success')
      

      
      
    }
  })
})

app.post('/createClass', verifyToken, function(req, res) {
  var cCode = req.body.class_code;
  var cName = req.body.class_name;
  var admin=''
  
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      admin = authData.user.username;
      connection.query('INSERT INTO classes VALUES( "'+ cCode +'","' + cName + '","' + admin+'")', function(error, rows, fields){
        if(!!error){
          res.send('Error in the add class query');
          console.log(error);
        }
        else{
          connection.query(`CREATE TABLE ${cCode}(username varchar(200) not null);`, function(error, rows, fields){
            if(!!error){
              res.send('Error in the add class query');
              console.log(error);
            }
            else{
              res.send('Successful query')
            
            }
          // res.send('Successful query')
        
          });
        }

      
      
      });
    
      
    }
  
  })
})

app.get('/getAllStudentClasses', verifyToken, function(req,res){
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403)
    }
    else{
      connection.query(`SELECT classcode from students WHERE username='${authData.user.username}'`, (err,codes) => {
        if(err) throw err;
        var codeString=codes[0].classcode;
        var codesArr=[]
        if(codeString!==''){
          codesArr=codeString.split(',')
        }

        
        if(codesArr[0]=="none"){
          res.json({
            names:[],
            admins:[]
          })
        }
        else{
          var sqlQ=''
          for(i=0;i<codesArr.length;i++){
            sqlQ+=`SELECT class_name,admin from classes WHERE class_code='${codesArr[i]}'`
            if(i<codesArr.length-1){
              sqlQ+=' UNION ALL '
            }
          }
  
          var namesArr=[];
          var adminArr=[];
          var adminNamesArr=[];
          connection.query(sqlQ,(err,cData) => {
            if(err) throw err;
            for(i=0;i<cData.length;i++){
              namesArr.push(cData[i].class_name);
              adminArr.push(cData[i].admin);
            }
            

            var sqlQ2=''
            for(i=0;i<adminArr.length;i++){
              sqlQ2+=`SELECT first,last FROM teachers WHERE username='${adminArr[i]}'`
              if(i<adminArr.length-1){
                sqlQ2+=' UNION ALL '
              }
            }


            connection.query(sqlQ2,(err,adminNames) => {
              if(err) throw err;
              for(i=0;i<adminNames.length;i++){
                adminNamesArr.push(`${adminNames[i].first} ${adminNames[i].last}`)
              }
              res.json({
                names: namesArr,
                admins: adminArr,
                adminNames: adminNamesArr
              })
            });


          })

        }

        
        


      })
    }
  })
})


app.get('/getClasses',verifyToken, function(req,res){

  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query('SELECT class_name FROM classes WHERE admin="'+authData.user.username+'";', (err,names) => {
        if(err) throw err;
        var namesArr=[];
        for(i=0;i<names.length;i++){
          namesArr.push(names[i].class_name)
        }
        connection.query('SELECT class_code FROM classes WHERE admin="'+authData.user.username+'";', (err,codes) => {
          if(err) throw err;
          var codesArr=[];
          var studentArr=[];

          for(i=0;i<codes.length;i++){
            codesArr.push(codes[i].class_code)
          }

          var sqlQ=''
          // var sqlQ2=''
          for(i=0;i<codesArr.length;i++){
            // sqlQ+=`SELECT class_name,class_code FROM classes WHERE class_code="${codesArr[i]}"` 
            sqlQ+=`SELECT username FROM ${codesArr[i]}`
            if(i<codesArr.length-1){
              sqlQ+=' UNION ALL '
              // sqlQ2+=' UNION ALL '
            } 
          }

          connection.query(sqlQ, (err,students) =>{
            if(err) throw err;
            for(i=0;i<students.length;i++){
              studentArr.push(students[i].username);
            }

            res.json({
              names: namesArr,
              codes: codesArr,
              students: studentArr
            })
          
          
          });



          // console.log('FSAFDFADSF')
          // console.log(studentArr)
        
        });
        
      });
      
    }
  })
})

app.post('/updateTable',function(req,res){
  var class_code=req.body.class_code;
  connection.query(`SELECT class_name,admin from classes WHERE class_code='${class_code}'`,(err,data) => {
    if(err) throw err;
    res.json({
      name: data[0].class_name,
      admin: data[0].admin
    })
  })
})

app.post('/updateClassTable',function(req,res){
  var class_name=req.body.class_name;
  var studentsArr =[]
  connection.query(`SELECT class_code from classes WHERE class_name='${class_name}'`,(err,data) => {
    if(err) throw err;
    connection.query(`SELECT * from ${data[0].class_code}`,(err,students) => {
      if(err) throw err;
      
      for(i=0;i<students.length;i++){
        studentsArr.push(students[i].username)
      }

    
    })
    res.json({
      code: data[0].class_code,
      students: studentsArr
      
    })
  })
})

app.post('/joinClass', verifyToken, function(req,res){
  var class_code = req.body.class_code;
  var sameClass=false;
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query('SELECT class_code FROM classes;', (err, codes) => {
        if(err) throw err;
        var codesArr =[]
        for(i=0;i<codes.length;i++){
          if(codes[i].class_code == class_code){
            codesArr.push(class_code)
          }
        }
        if(codesArr.length == 0){
          res.send("Invalid Class Code")
        }
        else{
          connection.query(`SELECT classcode from students WHERE username='${authData.user.username}'`,(err,classes) => {
            if(err) throw err;
            var classesString= classes[0].classcode
            if(classesString == 'none'){
              connection.query(`UPDATE students SET classcode='${codesArr[0]}' WHERE username='${authData.user.username}';`, (err,students) => {
                if(err) throw err;
                connection.query(`INSERT INTO ${codesArr[0]}(username) VALUES ('${authData.user.username}');`, (err,names) => {
                  if(err) throw err;
                  res.send('Successful query. Joined class')  
                })
  
              })
            }
            else{
              if(classesString.split(',').includes(class_code)){
                res.send('Already Joined This Class!')
              }
              else{
                connection.query(`UPDATE students SET classcode=concat(classcode,',${codesArr[0]}') WHERE username='${authData.user.username}';`, (err,students) => {
                  if(err) throw err;
                  connection.query(`INSERT INTO ${codesArr[0]}(username) VALUES ('${authData.user.username}');`, (err,names) => {
                    if(err) throw err;
                    res.send('Successful query. Joined class')
                  })
    
                })

              }
            }
          })
        }

      })
      
    }
  })

})

app.post('/getAllStudentAssignments', verifyToken, function(req,res){
  var student = req.body.name;
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`SELECT * FROM ${student} where admin='${authData.user.username}';`, (err, aData) => {
        if(err) throw err;
        namesArr=[]
        progArr=[];
        datePostedArr=[];
        attemptsArr=[]
        dateDueArr=[]
        for(i=0;i<aData.length;i++){
          namesArr.push(aData[i].name)
          progArr.push(aData[i].progress)
          datePostedArr.push(aData[i].time_posted)
          attemptsArr.push(aData[i].attempts)
          dateDueArr.push(aData[i].date)
        }
        
        res.json({
          assignments: namesArr,
          progress: progArr,
          datePosted: datePostedArr,
          attempts: attemptsArr,
          dateDue: dateDueArr
        })
        


      })
      
    }
  })

})

app.get('/checkIfInClass',verifyToken, function(req,res){
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query('SELECT username FROM students WHERE classcode IS NULL OR classcode="";', (err,names) => {
        if(err) throw err;
        sNames=[]
        for(i=0;i<names.length;i++){
          sNames.push(names[i].username);
        }

        if(sNames.includes(authData.user.username)){
          res.send('Not In Class')
        }
        else{
          res.send('In Class')
        }
        
      });
      
    }
  })

})

app.post('/getStudents', function(req,res){
  var class_name = req.body.class_name;  
  connection.query('SELECT class_code FROM classes WHERE class_name="'+class_name+'";', (err,names) => {
    if(err) throw err;
    connection.query('SELECT username FROM students WHERE classcode="' + names[0].class_code + '";', (err,studentNames) => {
      if(err) throw err;
      var sArr=[]
      for(i=0;i<studentNames.length;i++){
        sArr.push(studentNames[i].username)
      }
      res.end(sArr.toString())


    })
    
  });
      
    
  
})

//USED TO GET ASSIGNMENT DATA FOR STUDENT SOLVE PAGE
app.post('/getAssignmentData', verifyToken,function(req,res){
  // var aName = req.body.aName;  
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      var aName = req.body.aName;  
      var admin = req.body.admin;
      connection.query(`SELECT preC,postC,exIn,exOut,testIn,testOut,language,initialCode,date,progress,attempts,time_posted,admin from ${authData.user.username} WHERE name='${aName}' AND admin='${admin}';`, (err,data) => {
        if(err) throw err;

        // var s='[4,2,6,7]$$,[3,63,143,1]$$,@@,2$$,1'
        // var k= s.split('$$,')
        // var qw= k.toString().split('@@,')
        // console.log(qw)
        
        // console.log(data[0].exIn)
        //CONVERTS THE PARSABLE STRING FROM DATABASE BACK INTO ORIGINAL 2D ARRAY TO SEND TO CLIENT. USE IN /GETASSIGNMENTDATA

        var x=data[0].exIn.split('$$,')
        var temp = x.join(',,').split('@@,')
        var eIn=[]
        console.log(x.length)
        
        console.log(x)
        for(i=0;i<temp.length;i++){
          eIn.push(temp[i].split(',,'))
        }

        var eOut=data[0].exOut.split('$$,')
        // console.log(eOut)

        var x2=data[0].testIn.split('$$,')
        var temp2 = x2.join(',,').split('@@,')
        var tIn=[]
        for(i=0;i<temp2.length;i++){
          tIn.push(temp2[i].split(',,'))
        }
        // console.log(tIn)

        var tOut=data[0].testOut.split('$$,')
        // console.log(tOut)

        res.json({
          preC:data[0].preC,
          postC:data[0].postC,
          exIn:eIn,
          exOut:eOut,
          testIn:tIn,
          testOut:tOut,
          language:data[0].language,
          initialCode:data[0].initialCode,
          dateDue:data[0].date,
          progress:data[0].progress,
          attempts:data[0].attempts,
          datePosted:data[0].time_posted,
        })
        
        
      });
    }
  })
      
    
  
})

//USED TO GET ALL STUDENTS FOR EACH CLASS ON TEACHER POST PAGE
//ALSO USED TO GET ALL CLASSES FOR TEACHER ON CREATE CLASS PAGE
app.get('/getAllStudents',verifyToken, function(req,res){
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`SELECT class_code FROM classes WHERE admin="${authData.user.username}";`, (err,codes) => {
        if(err) throw err;
        var codesArr=[];
        for(i=0;i<codes.length;i++){
          codesArr.push(codes[i].class_code)
        }
        if(codesArr.length == 0){
          res.json({
            classes: [],
            codes: [],
            students: []
          })

        }
        else{
          var sqlQ=''
          var sqlQ2=''
          for(i=0;i<codesArr.length;i++){
            sqlQ+=`SELECT class_name,class_code FROM classes WHERE class_code="${codesArr[i]}"` 
            sqlQ2+=`SELECT username, "${codesArr[i]}" as classcode FROM ${codesArr[i]}`
            if(i<codesArr.length-1){
              sqlQ+=' UNION ALL '
              sqlQ2+=' UNION ALL '
            } 
          }
      
          console.log(sqlQ2)
          connection.query(sqlQ, (err,classNames) =>{
            if(err) throw err;
            var classNamesArr=[];
            console.log(classNames);
            for(i=0;i<classNames.length;i++){
              // console.log(classNames[i].class_name)
              classNamesArr.push(classNames[i].class_name);
            }
            connection.query(sqlQ2, (err,names) =>{
              if(err) throw err;
              // console.log(names[0].username)
              var namesArr=[];
              for(i=0;i<names.length;i++){
                // console.log(classNames[i].class_name)
                namesArr.push(names[i].username);
              }
      
              var finalArr= [];
              for(i=0;i<classNames.length;i++){
                finalArr.push([])
              }
      
              // console.log(names.length)
              for(i=0;i<names.length;i++){
                for(j=0;j<classNames.length;j++){
                  if(classNames[j].class_code == names[i].classcode){
                    finalArr[j].push(names[i].username)
                  }
                }
              }
      
              res.json({
                classes: classNamesArr,
                codes: codesArr,
                students: finalArr
              })
      
          
            })
        
          })

        }
    
        
    
      })
      
    }
  })
      
    
  
})

app.get('/getAssignments',verifyToken ,function(req,res){
  
  
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query(`SELECT class_code FROM classes where admin='${authData.user.username}';`, (err,codes) =>{
        if(err) throw err;
        var codesArr=[];
        for(i=0;i<codes.length;i++){
          codesArr.push(codes[i].class_code);
        }

        var sqlQ=''
        for(i=0;i<codesArr.length;i++){
          sqlQ+=`SELECT username FROM ${codesArr[i]}`
          if(i<codesArr.length-1){
            sqlQ+=' UNION '
            // sqlQ2+=' UNION ALL '
          } 
        }

        if(codesArr.length>0){


          connection.query(sqlQ, (err,names) =>{
            if(err) throw err;
            var namesArr=[];
            for(i=0;i<names.length;i++){
              // console.log(classNames[i].class_name)
              namesArr.push(names[i].username);
            }

  
            var sqlQ2=''
            for(i=0;i<namesArr.length;i++){
              sqlQ2+=`SELECT name FROM ${namesArr[i]} WHERE admin='${authData.user.username}'`
              if(i<namesArr.length-1){
                sqlQ2+=' UNION '
                // sqlQ2+=' UNION ALL '
              } 
            }

            console.log(sqlQ2)

            if(namesArr.length>0){
              connection.query(sqlQ2, (err,assignments) =>{
                if(err) throw err;
                var assignmentsArr=[];
                for(i=0;i<assignments.length;i++){
                  // console.log(classNames[i].class_name)
                  assignmentsArr.push(assignments[i].name);
                }
    
                res.json({
                  assignments:assignmentsArr
                })
    
    
    
    
    
              });

            }
            else{
              res.json({
                assignments:[]
              })
            }
  
          })

        }
        else{
          res.json({
            assignments:[]
          })
        }



        // res.send(codesArr.toString());

      })
        
      
      
    }
  
  })


})

app.post('/removeStudent',verifyToken, function(req,res){  
  
  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      var cName = req.body.class;
      var username = req.body.username;   
      connection.query(`SELECT class_code FROM classes WHERE class_name='${cName}' AND admin ='${authData.user.username}';`, (err,codes) => {
        if(err) throw err;
        connection.query(`SELECT classcode FROM students WHERE username='${username}';`, (err,codeString) => {
          if(err) throw err;
          var string = codeString[0].classcode
          var tempArr = []
          tempArr= string.split(',')
          var index = tempArr.indexOf(codes[0].class_code)
          if(index > -1){
            tempArr.splice(index,1);
          }
          connection.query(`UPDATE students SET classcode='${tempArr.toString()}' WHERE username='${username}'`, (err,studentNames) => {
            if(err) throw err;
           
            connection.query(`DELETE FROM ${codes[0].class_code} where username='${username}';`, (err,studentNames) => {
              if(err) throw err;
              res.send('Removed Student')
            })
            
          })
        })
          
      });
    
      
    }
  
  })   
  
})

// gets usernames, first names, and last names for all students in a specific class
app.post('/getClassStudents',verifyToken, function(req,res){  

  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      var cName = req.body.class;   
      connection.query(`SELECT class_code FROM classes WHERE class_name='${cName}' AND admin ='${authData.user.username}';`, (err,codes) => {
        if(err) throw err;
        

        connection.query(`SELECT username FROM ${codes[0].class_code}`, (err,names) => {
          if(err) throw err;
          


          var namesArr=[];
          for(i=0;i<names.length;i++){
            namesArr.push(names[i].username)
          }

          var sqlQ=''
          for(i=0;i<namesArr.length;i++){
            sqlQ+=`SELECT first,last FROM students WHERE username='${namesArr[i]}'`
            if(i<namesArr.length-1){
              sqlQ+=' UNION '
            } 
          }

          connection.query(sqlQ, (err,studentNames) => {
            if(err) throw err;

            var firstArr=[]
            var lastArr=[]
            for(i=0;i<studentNames.length;i++){
              firstArr.push(studentNames[i].first);
              lastArr.push(studentNames[i].last);
            }

            
            
            
            
            res.json({
              first:firstArr,
              last: lastArr,
              username: namesArr
            })
            
          });


        })
        
      });
    
      
    }
  
  })
      
})

//USED FOR PAGE WHERE THERES A DROPDOWN FOR ASSIGNMENT AND ALL STUDENTS WITH THAT ASSIGNMENT LOAD
app.post('/getTeacherAssignmentData',verifyToken ,function(req,res){ 
  var aName = req.body.name;   

  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      var aName = req.body.name;   
      connection.query('SELECT class_code FROM classes WHERE admin="'+authData.user.username+'";', (err,codes) => {
        if(err) throw err;

        var codesArr=[];
        for(i=0;i<codes.length;i++){
          codesArr.push(codes[i].class_code);
        }

        var sqlQ=''
        for(i=0;i<codesArr.length;i++){
          sqlQ+=`SELECT username from ${codesArr[i]}`
          if(i<codesArr.length-1){
            sqlQ+=' UNION '
          } 
        }

        connection.query(sqlQ, (err,studentNames) => {
          if(err) throw err;
          let sArr=[]
          for(i=0;i<studentNames.length;i++){
            sArr.push(studentNames[i].username)
          }

          var query=''
          var studentsArr=[]
          for(i=0;i<sArr.length;i++){
            query+=`SELECT name,'${sArr[i]}' as student FROM ${sArr[i]} where name='${aName}' and admin='${authData.user.username}'`
            if(i<sArr.length-1){
              query+= ' UNION ALL '
            }

          } 

          connection.query(query,(err,aNames)=>{
            if(err) throw err;
            
              for(i=0;i<aNames.length;i++){
                studentsArr.push(aNames[i].student)
              }
          })

          var sqlQ2=''
          for(i=0;i<sArr.length;i++){
            sqlQ2+=`SELECT progress,time_posted,attempts,date from ${sArr[i]} where name="${aName}" and admin="${authData.user.username}"`
            if(i<sArr.length-1){
              sqlQ2+=' UNION ALL '
            } 
          }

          connection.query(sqlQ2, (err,aData) =>{
            if(err) throw err;

            progArr=[];
            datePostedArr=[];
            attemptsArr=[]
            dateDueArr=[]
            for(i=0;i<aData.length;i++){
              progArr.push(aData[i].progress)
              datePostedArr.push(aData[i].time_posted)
              attemptsArr.push(aData[i].attempts)
              dateDueArr.push(aData[i].date)
            }

            var sqlQ3=''
            for(i=0;i<studentsArr.length;i++){
              sqlQ3+=`SELECT first,last FROM students WHERE username='${studentsArr[i]}'`
              if(i<studentsArr.length-1){
                sqlQ3+=' UNION ALL '
              }
            }

            var namesArr=[]
            connection.query(sqlQ3,(err,sNames)=>{
              if(err) throw err;
              
              for(i=0;i<sNames.length;i++){
                namesArr.push(`${sNames[i].first} ${sNames[i].last}`)
              }
               
                
              res.json({
                students: studentsArr,
                names: namesArr,
                progress: progArr,
                datePosted: datePostedArr,
                attempts: attemptsArr,
                dateDue: dateDueArr
              })
            })
          });



        })
        
      });
    
      
    }
  
  })
      
    
  
})

//USED TO DISPLAY ASSIGNMENTS TO STUDENT ON VIEW ASSIGNMENT PAGE
app.get('/getStudentAssignmentData',verifyToken,function(req,res){ 
  


  jwt.verify(req.token, 'secretkey', (err,authData) => {
    if(err){
      res.sendStatus(403);
    }
    else{
      connection.query('SELECT name FROM ' + authData.user.username + ';', (err,names) => {
        if(err) throw err;
        var namesArr=[];
        for(i=0;i<names.length;i++){
            namesArr.push(names[i].name);
          }
        connection.query('SELECT date FROM ' + authData.user.username + ';', (err,dates) =>{
          if(err) throw err;
          var datesArr=[];
          for(i=0;i<dates.length;i++){
            datesArr.push(dates[i].date);
          }
          connection.query('SELECT progress FROM ' + authData.user.username + ';', (err,progress) =>{
            if(err) throw err;
            var progressArr=[];
            for(i=0;i<progress.length;i++){
              progressArr.push(progress[i].progress);
            }
            connection.query('SELECT attempts FROM ' + authData.user.username + ';', (err,attempts) =>{
              if(err) throw err;
              var attemptsArr=[];
              for(i=0;i<attempts.length;i++){
                attemptsArr.push(attempts[i].attempts);
              }
              connection.query('SELECT time_posted FROM ' + authData.user.username + ';', (err,times) =>{
                if(err) throw err;
                var timesArr=[];
                for(i=0;i<times.length;i++){
                  timesArr.push(times[i].time_posted);
                }
                connection.query('SELECT admin FROM ' + authData.user.username + ';', (err,admins) =>{
                  if(err) throw err;
                  var adminArr=[];
                  for(i=0;i<admins.length;i++){
                    adminArr.push(admins[i].admin);
                  }

                  var sqlQ=''
                  for(i=0;i<adminArr.length;i++){
                    sqlQ+=`SELECT first,last FROM teachers WHERE username ='${adminArr[i]}'`
                    if(i<adminArr.length-1){
                      sqlQ+=' UNION ALL '
                    } 
                  }
                  connection.query(sqlQ, (err,aNames) => {
                    if(err) throw err;
                    let nArr=[]
                    for(i=0;i<names.length;i++){
                      nArr.push(`${aNames[i].first} ${aNames[i].last}`)
                    }
                    res.json({
                      names: namesArr,
                      dates: datesArr,
                      progress: progressArr,
                      attempts: attemptsArr,
                      times: timesArr,
                      admin:adminArr,
                      adminNames: nArr
                    })
                  
                  
                  });
                });
              });
              
              
            })
        });
        
      });
    });     
    }
  })
})




function verifyToken(req, res, next){
  const bearerHeader = req.headers['authorization']
  if(typeof bearerHeader !== 'undefined'){
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  }
  else{
    res.sendStatus(403);
  }

}

app.listen(3000,function(){
  console.log("Server Listening on PORT 3000");
})
