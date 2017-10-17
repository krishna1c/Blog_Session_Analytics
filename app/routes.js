// app/routes.js

// load the todo model
var mongoose=require('mongoose');
var User=require('./models/user');
var jwt    = require('jsonwebtoken');
var session = require('express-session');
var blog=require('./models/blog')(mongoose);
const ObjectId = mongoose.Types.ObjectId;

var SplunkLogger = require("splunk-logging").Logger;

var config = {
    token: "9A7B0C99-B98C-45F4-BA4B-942B55A3E065",
    url: "https://input-prd-p-m4v6gbkv53m9.cloud.splunk.com:8088/services/collector"
};

var Logger = new SplunkLogger(config);

//Logging to Splunk
function logToSplunk(path, description, req){
    var payload = {
        message: {
            sessionId: req.session.id,
            path: path,
            body: req.body,
            params: req.params,
            user: req.session.user,
            description: description,
            timestamp: new Date().toLocaleString()
        }
    };
    Logger.send(payload, function(err, resp, body) {
        // If successful, body will be { text: 'Success', code: 0 }
        console.log("Response from Splunk", body);
    });
}
// expose the routes to our app with module.exports
module.exports = function(app) {

    // api ---------------------------------------------------------------------
    //Splunk Logging End Point
    app.post('/log/content', function(req, res){
        logToSplunk(req.body.path, req.body.description, req);
        var output = {
            status: "success"
        }
        return output
    });

    //Register User
    app.post('/register', function(req, res) {
        req.session.regen('/register', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/register', 'Creating New User', req);
        User.findOne({email: req.body.email}, function(err, user) {
         if (err) throw err;
         if (user) {
            res.status(409).json({ success: false, message: 'Email already taken'});
         } 
         else
         {
            User.create({
                name : req.body.name,
                password:req.body.password,
                email:req.body.email,
                done : true
              }, function(err, userDetails) {
               
                  if (err) { 
                     return res.status(401).send(err);
                  }
                  else
                    return res.json(userDetails);
                
                
            }); 
          }
      })   

    });

    //Get Blogs
    app.get('/blog/get',auth,function(req,res){
        req.session.regen('/blog/get', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/get', 'Get blog records', req);
        var regex = new RegExp(req.query.searchTerm,'i');
        if(req.query.userId!=undefined)
         {   var query={
                $and: [ 
                    { 
                        $or: [
                          {'title': regex},
                          {'body': regex}
                       ]
                    },
                    {    
                         'userId': req.query.userId 
                    }
                ]}
        }
        else
        {
           var query={
                $and: [ 
                    { 
                        $or: [
                          {'title': regex},
                          {'body': regex}
                       ]
                    }
                ]} 
        }
        var page,size;
        console.log(req.query.page);
        if(req.query.page==undefined||req.query.page==0)
            page=0;
        else
            page=req.query.page;
        if(req.query.size==undefined)
            size=10
        size=parseInt(req.query.size);

        blog.Blog.find(query)
        .limit(size)
        .skip(size*page)
        .sort([[ 'created_at', 'descending']])
        .exec(function(err, data) {
            if (err)
                res.send(err)
            var userId;
             if(req.query.userId!=undefined)
                 blog.Blog.find({userId:req.query.userId}).count(function(err, count){
                    console.log("Number of docs: ", count );
                    res.json({blogs:data,count:count});

                });
             else{
             blog.Blog.find().count(function(err, count){
                    console.log("Number of docs: ", count );
                    res.json({blogs:data,count:count});

                });
            }
        });

    });

    //Get most upvoted blogs
    app.get('/blog/featured',auth,function(req,res){
        req.session.regen('/blog/featured', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/featured', 'Get featured records', req);
        blog.Blog.find({})
        .limit(4)
        .skip(0)
        .sort([[ 'upvotes', 'descending']]).exec(function(err, data) {
            if (err)
                res.send(err)
            res.json(data);
        });

    });

    //Get Blogs by Id
    app.get('/blog/get/:id',auth,function(req,res){
        req.session.regen('/blog/get/:id', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/get/:id', 'Get Blog record by Id', req);
        blog.Blog.findById(req.params.id,function(err,blog){
            if(err)
                res.send(err);
            res.json(blog);
        })
    });

    //Add blog    
    app.post('/blog/add',auth, function(req, res) {
        req.session.regen('/blog/add',req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/add', 'Add New Blog Record', req);
        blog.Blog.create({
            author : req.body.author,
            title : req.body.title,
            body:req.body.body,
            imageUrl:req.body.imageUrl,
            userId: req.body.userId
          }, function(err, blogDetails) {
            if (err)
                res.send(err);
            res.json(blogDetails);
            console.log(blogDetails);
        });    

    });  

    //Update blog
    app.put('/blog/update/:id', auth,function(req, res, next) {
        req.session.regen('/blog/update/:id', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/update/:id', 'Update Blog record', req);
            //instead of req.body we can use $set for specific field updates  { "$set": { "name": name, "genre": genre, "author": author, "similar": similar}}
      blog.Blog.findByIdAndUpdate(req.params.id, req.body, function (err, post) {
        if (err) 
            res.send(err);
        console.log(post);
        res.json(req.body);
            
         });

    });

    //Remove blog
    app.delete('/blog/delete/:id',auth,function(req,res){
        req.session.regen('/blog/delete/:id', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/delete/:id', 'Delete Blog Record', req);
         blog.Blog.remove({
            _id : req.params.id
        }, function(err, data) {
            if (err)
                res.send(err);
            res.json(data);      
        });
       

    }); 

    //Increment upvotes
    app.post('/blog/upvote/:id',auth,function(req,res){
        req.session.regen('/blog/upvote/:id', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/upvote/:id', 'Upvote the the Blog Record', req);
        //id is _id
        var query={
                          '_id':req.params.id,   
                }
         var steps=[
                   
                    {"$unwind": "$upvoters"},
           
                   
                    {"$match": {
                    '_id':ObjectId(req.params.id)}
                    },
                    {"$match": 
                     
                    {"upvoters.userId":req.body.userId}


                    },
                    //Project the accoutns.cars object only
                     {"$project" : {"upvoters" : 1}},
                    // //Group and return only the car object
                     {"$group":{"_id":"$upvoters"}}
            ];
             blog.Blog.aggregate(steps, function (err, user) {
                //{'comments.upvoters': {$elemMatch: {userId: req.body.userId}}}
                if (err){
                    res.send(err);
                }    
                console.log(user);
                if (user.length!=0) {
                     blog.Blog.findOneAndUpdate(query,{$pull : {"upvoters": {userId: req.body.userId}}},
                      function(err,post){
                        if(err)
                            {
                                console.log(err);
                                res.send(err);
                            }
                            else
                            {
                                
                                blog.Blog.update(query,{'$inc':{'upvotes':-1}},function(err,post){

                                    if(err)
                                        res.send(err);
                                    post.upvotes=post.upvotes+1; //i have to increment it by one everytime
                                    //console.log(post);
                                    res.json({post:post,upvote:false});
                                    //to sort comments on basis of most upvotes
                                 
                                });
                            } 
                        });
                


                } else {
                   
                    blog.Blog.findOneAndUpdate(query,{$push : {"upvoters": {userId: req.body.userId}}},
                      function(err,post){
                        if(err)
                            {
                                console.log(err);
                                res.send(err);
                            }
                            else
                            {
                                
                                blog.Blog.update(query,{'$inc':{'upvotes':1}},function(err,post){

                                    if(err)
                                        res.send(err);
                                    post.upvotes=post.upvotes+1; //i have to increment it by one everytime
                                    //console.log(post);
                                    res.json({post:post,upvote:true});
                                    
                                });
                            } 
                        });
                


                }

            });


    });

    // SearchBlog
    app.get('/blog/search',auth,function(req,res){
        req.session.regen('/blog/search', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/search', 'Search the Blog Records', req);
        var regex = new RegExp(req.query.searchTerm,'i');
        blog.Blog.find({ $or: [
              {'title': regex},
              {'body': regex}
           ] })
        .exec(function(err,results) {
             if(err)
                res.send(err);
            console.log(results);
            res.json(results);

        });

    });


    //Add comments
    app.post('/blog/comments/add/:id',auth,function(req,res){
        req.session.regen('/blog/comments/add/:id', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/comments/add/:id', 'Add the Comment to Blog', req);
        var comment=[{person:req.body.person,comment:req.body.comment,userId:req.body.userId}];
        console.log(req.body);
        console.log(comment);
        // console.log(req.body.comments[0].person);
        blog.Blog.findByIdAndUpdate(req.params.id,
         {
            $push: {
                "comments": {
                    $each:comment,
                    $sort:{ "upvotes" : -1 }
                    } 
                }
         },
         {safe: true, upsert: true, new : true},function (err, post) {
            if (err)
                res.send(err);
            console.log(post);
            res.json(post);
        }); 
       

    }); 

    //Update comment
    app.post('/blog/comments/update',auth,function(req,res){
        req.session.regen('/blog/comments/update', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/comments/update', 'Update the Comment to Blog', req);
        query={'_id':req.body.id,'comments._id':req.body.comment_id}
        blog.Blog.update(query, {'$set': {'comments.$.comment': req.body.comment}},
            function(err,post){
                     if(err)
                        res.send(err);
                    res.json(post);
        })

    });

    //Increment comment upvotes
    app.post('/blog/comments/upvote',auth,function(req,res){
        req.session.regen('/blog/comments/upvote', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/comments/update', 'Upvote the Comment to Blog', req);
            var query={
                          '_id':req.body.id,
                          'comments._id':req.body.comment_id
                        }
            var steps=[
                   
                    {"$unwind": "$comments"},
                    //De-normalized the nested array of comments and upvoters
                    {"$unwind": "$comments.upvoters"},
                    //match id with params.id
                    {"$match": {
                    'comments._id':ObjectId(req.body.comment_id)}
                    },
                    {"$match": 
                     
                    {"comments.upvoters.userId":req.body.userId}


                    },
                    //Project the comments.upvoters object only
                     {"$project" : {"comments.upvoters" : 1}},
                    // //Group and return only the upvoters object
                     {"$group":{"_id":"$comments.upvoters"}}
            ];
             blog.Blog.aggregate(steps, function (err, user) {
                //{'comments.upvoters': {$elemMatch: {userId: req.body.userId}}}
                if (err){
                    res.send(err);
                }    
                
                if (user.length!=0) {
                     blog.Blog.findOneAndUpdate(query,{$pull : {"comments.$.upvoters": {userId: req.body.userId}}},
                      function(err,post){
                        if(err)
                            {
                                console.log(err);
                                res.send(err);
                            }
                            else
                            {
                                
                                blog.Blog.update(query,{'$inc':{'comments.$.upvotes':-1}},function(err,post){

                                    if(err)
                                        res.send(err);
                                    post.upvotes=post.upvotes+1; //i have to increment it by one everytime
                                    //console.log(post);

                                    //to sort comments on basis of most upvotes
                                    blog.Blog.findByIdAndUpdate(req.body.id, {$push : {"comments" :{$each  : [] , $sort : {"upvotes" : -1}}}},{safe: true, upsert: true, new : true},function(err,details){

                                        if(err)
                                            res.send(err);
                                        res.json(details);
                                    })
                                    
                                });
                            } 
                        });

                } else {
                   
                    blog.Blog.findOneAndUpdate(query,{$push : {"comments.$.upvoters": {userId: req.body.userId}}},
                      function(err,post){
                        if(err)
                            {
                                console.log(err);
                                res.send(err);
                            }
                            else
                            {
                                
                                blog.Blog.update(query,{'$inc':{'comments.$.upvotes':1}},function(err,post){

                                    if(err)
                                        res.send(err);
                                    post.upvotes=post.upvotes+1; //i have to increment it by one everytime
                                    //console.log(post);

                                    //to sort comments on basis of most upvotes
                                    blog.Blog.findByIdAndUpdate(req.body.id, {$push : {"comments" :{$each  : [] , $sort : {"upvotes" : -1}}}},{safe: true, upsert: true, new : true},function(err,details){

                                        if(err)
                                            res.send(err);
                                        res.json(details);
                                    })
                                    
                                });
                            } 
                        });
                


                }

            });


    });


    //Remove comments
    app.post('/blog/comments/delete',auth,function(req,res){
        req.session.regen('/blog/comments/delete', req, function(err) {
            if (err) {
                return res.status(500).send("There was an error. Please try again later.");
            }
        });
        logToSplunk('/blog/comments/delete', 'Delete the Comment to Blog', req); 
         var query={
                '_id':req.body.id,
                'comments._id':req.body.comment_id
                }
        // console.log(req.body.comments[0].person);
        blog.Blog.findOneAndUpdate(query, {$pull: { comments :{ _id:req.body.comment_id} }},{safe: true, upsert: true, new : true},function (err, post) {
            if (err)
                res.send(err);
            console.log(post);
            res.json(post);
        });
       

    }); 


    //Authenticate
    app.post('/authenticate', function(req, res) {
        var copyReq = req;
        copyReq.body.password = "";
        logToSplunk('/authenticate', 'Login to the Application', copyReq);
    //Find the user
        User.findOne({
            name: req.body.name
        }, function(err, user) {

            if (err) throw err;

            if (!user) {
                res.status(410).json({ success: false, message: 'Authentication failed. User not found.' });
            } else if (user) {

                //Check if password matches
                if (user.password != req.body.password) {
                    res.status(411).json({ success: false, message: 'Authentication failed. Wrong password.' });
                } else {
                    req.session.user = req.body.name;
                    req.session.regen('/authenticate', req, function(err) {
                        if (err) {
                            return res.status(500).send("There was an error logging in. Please try again later.");
                        }
                    });
                    res.json({
                        success: true,
                        message: 'Enjoy your session!',
                        session: req.session.user,
                        data:{"name":user.name,"password":user.password,"email":user.email,"_id":user._id,"userId":user.userId}
                    });
                }       

            }

          });
    });

    //Logout API
    app.get('/logout', function (req, res) {
      logToSplunk('/logout', 'Logout to the Application', req);
      req.session.destroy();
      res.send("logout success!");
    });

    //Verify session is available
    app.get('/verify',auth,function(req,res){
        logToSplunk('/verify', 'Verify if the user present in the Application', req);
        res.json({islogin:true});
    })

    //Verifying the session
   function auth(req, res, next) {
                  var sessionValue = req.body.token || req.param('token') || req.headers['token'];
         if (req.session && req.session.user === sessionValue)
            return next();
         else {
            return res.status(403).send({ 
                success: false, 
                message: 'No token provided.'
            });
            
        }
    };

};