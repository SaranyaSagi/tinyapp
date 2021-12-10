# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly) and visit the sites via the shortened links. Registered users can keep track of their urls, and have access to edit and delete features. Users can only edit or delete their own links when logged in. An HTTP Server was built that handles requests from the browser (client). Entire app was built in 4 days!

## Final Product

!["screenshot of /urls page when logged in"](https://github.com/SaranyaSagi/tinyapp/blob/master/docs/:urls.png?raw=true)

!["Screenshot of urls/:shortID"](https://github.com/SaranyaSagi/tinyapp/blob/master/docs/urls:shortid.png?raw=true)

!["Screenshot of urls/new"](https://github.com/SaranyaSagi/tinyapp/blob/master/docs/urls:new.jpg?raw=true)

!["Screenshot of urls/login"](https://github.com/SaranyaSagi/tinyapp/blob/master/docs/urls:login.png?raw=true)

!["Screenshot of urls/register"](https://github.com/SaranyaSagi/tinyapp/blob/master/docs/urls:register.png?raw=true)


## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node express_server.js` command.