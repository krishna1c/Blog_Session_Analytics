# Mongo-Express-Angular-NodeJs-MEAN-STACK-BLOG-with-auth
## www.testblog.ga 
Mean stack blog with authentication and session management and restricting apis based on session.<br />
<br />
Blog include functionalities and NodeJs APIs as follows:<br />
NODEJS:<br />
1)Register user<br />
2)Login user<br />
3)express-session & also JsonWebToken module to restrict some APIs for logged in users.<br />
4)ADD,EDIT,DELETE,GET Blog<br />
5)Add blog based on userId<br />
6)view particular blog based on Id.<br />
5)Upvote blog and comments.<br />
6)comment ADD,EDIT,DELETE and sorting according to upvotes.<br />
<br />
ANGULARJS:<br />
Route Restrictions to some pages requiring user login.<br />
handling server authentication with localStorage.<br />
<br />

## Instructions to run
Clone the project
```
git clone https://github.com/vigilante95/Mongo-Express-Angular-NodeJs-MEAN-STACK-BLOG-with-auth.git
```

### DataBase - Mongo
* Check if mongodb service is running in your machine else start the service.

### Server
* You need to have node and npm installed in your machine.
* open up your teminal or command prompt go to the directory `chat`
* Do install all dependencies using  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`npm install`  
   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`npm install -g nodemon`  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`nodejs server.js  or nodemon server.js`  
Your server will be setup and ready for use.

### UI
* Go to browser and type `localhost:8888` in place of url.
* Register user by giving basic details.
* Login from the same screen.  


#### APP RUNNING on Heroku server @ www.testblog.ga 
