/*!
 * fs-schema
 */

/**
 * Module dependencies.
 * @private
 */
var fs = require('fs'),
  path = require("path");

var walk = function(dir, done) {
  var results = [];

  function makeFileObject(p) {
    var name = path.basename(p, path.extname(p));
    var parent = path.dirname(p);
    return {
      "name": name,
      "url": p,
      "relative": p,
      "parent": parent
    };
  };

  function makeFolderObject(p) {
    var parent = path.dirname(p);
    var folders = p.split(parent);
    return {
      "name": folders[1],
      "url": p,
      "children": [],
      "relative": p,
      "parent": parent
    };
  };

  fs.readdir(dir, function(err, list) {

    var schema = makeFolderObject(dir);
    results = results.concat(schema);

    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = dir + '/' + file;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });

        } else {
          var fileObject = makeFileObject(file);
          results = results.concat(fileObject);

          if (!--pending) done(null, results);

        }
      });
    });
  });
};


// Traverse data and build the tree
var buildTree = function(arr) {
  var tree = {
    "root": arr[0]
  };

  for (var i = 0; i < arr.length; i++) {
    var elem = arr[i];
    var rootId = elem.parent;
    var parent = getParent(tree.root, rootId);
    if (parent) {
      parent.children.push(elem);
    }
  }
  return tree.root;
};

// Get parent of node (recursive)
var getParent = function(rootNode, rootId) {
  if (rootNode.relative === rootId)
    return rootNode;

  for (var i = 0; i < rootNode.children.length; i++) {
    var child = rootNode.children[i];
    if (child.relative === rootId) return child;

    if ((child.children) && (child.children.length > 0))
      var childResult = getParent(child, rootId);

    if (childResult != null) return childResult;
  }
  return null;
};

var build = function(folder, cb) {
  walk(folder, function(err, results) {
    var schema = buildTree(results);
    cb(err, schema);
  });
}

build("./schema",function(err, schema){
  console.log(JSON.stringify(schema, null, 4));
});
