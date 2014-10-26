 function getFollowers(user) {
   return new Promise(function(resolve) {
     var request = new XMLHttpRequest();
     request.onload = function() {
       resolve({
         user: user,
         followers: JSON.parse(
           this.responseText)
       });
     };
     request.open('get', 'https://api.github.com/users/' + user +
       '/followers?client_id=' + GITHUB_API_KEY + '&client_secret=' + GITHUB_SECRET,
       true);
     request.send();
   });
 }

 function parseUsers(users, map) {
   return Promise.all(users.map(function(user) {
       return getFollowers(user);
     }))
     .then(function(allData) {
       allData.forEach(function(obj) {
         if (!map[obj.user]) {
           map[obj.user] = {};
         }
         map[obj.user].followers =
           obj.followers.map(function(f) {
             return f.login
           });
         obj.followers.forEach(function(follower) {
           if (!map[follower.login]) {
             map[follower.login] = follower;
           }
         });
       });
       return map;
     });
 }


 window.github = {};
 window.github.getData = function(user, extensive) {
   return new Promise(function(resolve) {
         var request = new XMLHttpRequest();
         request.onload = function() {
           resolve(JSON.parse(this.responseText).avatar_url);
         };
       request.open('get', 'https://api.github.com/users/' + user +
         '?client_id=' + GITHUB_API_KEY + '&client_secret=' + GITHUB_SECRET, true);
         request.send();
     })
     .then(function(url){
       var nodes = {};
       nodes[user] = {
         name : user,
         image : url
       };
       return parseUsers([user], nodes);
     })
     .then(function(data) {
       if(extensive){
         return parseUsers(Object.keys(data), data);
       }
       return data;
     })
     .then(function(nodes) {
       return Object.keys(nodes).reduce(function(result, key) {
         var node = {};
         node.name = key;
         node.image = nodes[key].avatar_url;
         node.followers = nodes[key].followers;
         result[key] = node;
         return result;
       }, {});
     });
 };
