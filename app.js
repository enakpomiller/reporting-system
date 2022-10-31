const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt  = require('bcrypt');
const session = require('express-session'); 



const app = express();

const port = process.env.port || 2000; 

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// mysql
const pool = mysql.createPool({
    connectionLimit   :     100,
    noat              : 'localhost',
    user              : 'root',
    password          :  '',
    database          : 'node_stud_report_syst'

});

// display users record
app.get('',(req,res)=>{
     pool.getConnection((err,connection)=>{
         if(err) throw err;
         console.log('connection as ID'+connection.threadId);
         connection.query('SELECT * FROM tbl_signup WHERE usertype="student"',(err,rows)=>{
             connection.release();
             if(!err){
                 res.send(rows);
             }else{
                 console.log(err);
             }
         })

     })

})

// display student report 
app.get('/disp_stud_report',(req,res)=>{
    pool.getConnection((err,connection)=>{
        if(err) throw err;
        console.log('connection as ID '+connection.threadId);
        connection.query('SELECT * FROM tbl_stud_report',(err,rows)=>{
            connection.release();
            if(!err){
                res.send(rows);
            }else{
                res.send(' cannot statch out record');
            }
        })
    })
})
// get a value by id 
app.get('/:id',(req,res)=>{
    pool.getConnection((err,connection)=>{
        if(err) throw err;
        console.log('connection as ID'+connection.threadId);
        connection.query('SELECT * FROM tbl_signup WHERE id=?', [req.params.id],(err,rows)=>{
            connection.release();
            if(!err){
                res.send(rows);
            }else if(err){
                console.log(err);
            }else if(rows==0){
                console.log(' record not found');
            }
            
        })
    })
})

// delete record by id
app.delete('/delete_user/:id',(req,res)=>{
    pool.getConnection((err,connection)=>{
        if(err) throw err;
        console.log('connection as ID'+connection.threadId);
        connection.query('DELETE FROM tbl_signup WHERE id=?', [req.params.id],(err,rows)=>{
            connection.release();
            if(!err){
                res.json(`User ID ${req.params.id} has been deleted`);
            }else{
                console.log(err);
            }
        })
    })
})


// create record
app.post('/register', async (req,res)=>{
    const  {first_name,second_name,gender,email,course,password,usertype}= req.body;
     const hashpassword = await bcrypt.hash(password, 10);
  
     if(first_name=="" || second_name=="" || gender=="" || email=="" || course=="" || password=="" || usertype==""){
        res.send('please fill all fields');
     }else{ 
        pool.getConnection((err,connection)=>{
            if(err) throw err;
            console.log('connection as ID'+connection.threadId);
            connection.query('Select * FROM tbl_signup WHERE email=?',[email],(err,rows)=>{
                connection.release();
                const UserExist = rows[0];
                if(UserExist){
                    res.send("user email "+email+" already exist");
                }else{
                    //insert
                    connection.query('INSERT INTO tbl_signup SET first_name=?,second_name=?,gender=?,email=?,course=?,password=?,usertype=?', [first_name,second_name,gender,email,course,hashpassword,usertype], (err,rows)=>{
                    if(!err){
                            res.json(` Account has been created for ${first_name} ${second_name}`);
                     }else{
                         console.log(err); 
                        }
                     })
                   //end insert   
                }
            })

    })
}

})


// send student report on student dashboard
app.post('/send_stud_report',(req,res)=>{
    const {stud_name,dept,week,completed_task,ongoing_task,task_for_week,date}=req.body;
   pool.getConnection((err,connection)=>{
       if(err) throw err;
       console.log('connection ID '+connection.threadId);
       connection.query('INSERT INTO tbl_stud_report SET stud_name=?,dept=?,week=?,completed_task=?,ongoing_task=?,task_for_week=?,date=?', [stud_name,dept,week,completed_task,ongoing_task,task_for_week,date],(err,rows)=>{
           connection.release();
           if(!err){
               res.json([req.body.stud_name]+' Your Report was  Sent Successfully');
           }else{
               res.send('cannot insert into student table');
           }
       })
   })
})



// update record
app.put('/update_users',(req,res)=>{
    const  {id,first_name,second_name,email,course}=req.body;
   pool.getConnection((err,connection)=>{
       if(err) throw err;
       console.log('connection as ID'+connection.threadId);
       connection.query('UPDATE tbl_signup SET first_name=?,second_name=?,email=?,course=?', [first_name,second_name,email,course,id], (err,rows)=>{
           connection.release(); // return the connection to pool
           if(!err){
               res.status(200).send(`${first_name} you account is updated`);
           }else{
               console.log(err);
           }
       })
       
   })
})


// update student report via dashboard
app.put('/update_stud_report',(req,res)=>{
 const {id,stud_name,dept,week,completed_task,ongoing_task,task_for_week,date}=req.body;
 pool.getConnection((err,connection)=>{
     if(err) throw err;
     console.log('connection as ID'+connection.threadId);
     connection.query('UPDATE tbl_stud_report SET stud_name=?,dept=?,week=?,completed_task=?,ongoing_task=?,task_for_week=?,date=?',[stud_name,dept,week,completed_task,ongoing_task,task_for_week,date,id],(err,rows)=>{
         connection.release();
         if(!err){
             res.send(stud_name+ ' Your  Report has been  Updated ');
         }else{
             res.send(' error cannot update report'+err);
         }
     })
 })

})


// login user
app.post('/login', async (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const usertype = req.body.usertype;
    pool.getConnection((err,connection)=>{
        if(err) throw err;
        console.log('connection as ID'+connection.threadId);
        if(email && password){
            connection.query('SELECT * FROM tbl_signup WHERE email=?',[email],async (err,rows)=>{
                connection.release();
                const UserExist =rows[0];
                if(UserExist){
                    const match = await bcrypt.compare(password,UserExist.password);
                    if(match && rows[0].usertype =="student"){
                        res.status(200).send(`Welcome to student dashboard ${rows[0].first_name}`);
                    }else if(match && usertype=="admin"  && rows[0].gender=="male"){
                        res.json('welcome to admin dashboard Mr '+rows[0].first_name);
                    }else if(match && usertype=="admin" && rows[0].gender=="female"){
                        res.json('welcome to admin dashboard Miss '+rows[0].first_name);
                    }else{
                        res.json(" Incorrect Login Credentials");
                    }
                    
                }else{
                    res.status(201).json(`Incorrect login details!`)
                }
            })
        }else{
            res.json(' please fill the feilds');
        }
        
    })
})





app.listen(port, ()=>console.log(` Reporting System App is running at port ${port}`))