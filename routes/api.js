'use strict';
const { ObjectId } = require('mongodb');
const myDB = require('../connection');

// initialize database connection
let myDataBase;

myDB().then(client => {
  myDataBase = client.db('database');
  console.log('Database connection established');
}).catch(err => {
  console.error("Database connection failed", err)
});

module.exports = function (app) {

  if (!myDataBase) {
    console.error('Database not initialized');
  }

  app.route('/api/issues/:project')

    .get(function (req, res){
      let project = req.params.project;

      // extract query parameters for filtering
      const query = req.query;

      // construct the filter object based on query parameters
      const filter = {};
      Object.keys(query).forEach(key => {
        if (query[key]) {
          // add non-empty query parameteres to the filter
          if (key === '_id') {
            // conver _id to ObjectId
            filter[key] = ObjectId(query[key]);
          } else if (key === 'open') {
            // convert 'open' to boolean
            filter[key] = query[key] === 'true';
          } else {
            filter[key] = query[key];
          }
        }
      });

      // fetch issued from the database based on projects and filter
      myDataBase.collection(project).find(filter).toArray(function(err,issues) {
        if (err) {
          res.status(404).json({ error: 'Issue not found' });
        } else {
          res.json(issues);
        }
      });
     })

    .post(function (req, res){
      let project = req.params.project;
      const {
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text
      } = req.body;

      // validate required fields
      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' })
      }

      // create a new issue object
      const newIssue = {
        _id: new ObjectId(),
        issue_title,
        issue_text,
        created_on: new Date(),
        updated_on: new Date(),
        created_by,
        assigned_to: assigned_to || '',
        open: true,
        status_text: status_text || ''
      };

      // insert the new issue into the database
      myDataBase.collection(project).insertOne(newIssue, function(err,result) {
        if (err) {
          res.json({ error: 'could not create an issue' });
        } else {
          res.json(result.ops[0]);
        }
      });
    })

    .put(async function (req, res){
      let project = req.params.project;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
        open
      } = req.body;

      // validate _id
      if (!_id || !ObjectId.isValid(_id)) {
        return res.json({ error: 'missing _id' });
      }

      // check if any update fields(s) are sent
      if (!issue_title && !issue_text && !created_by && !assigned_to && !status_text ) {
        return res.json({ error: 'no update field(s) sent', '_id': _id  })
      }

      // construct the update object
      try {
        // retrieve project data
        const projectData = await myDataBase.collection(project).findOne({ _id: ObjectId(_id) });

        // check if project exits
        if (!projectData) {
          return res.json({ error: "could not update", _id: _id });
        }

        // construct update object
        const updateFields = {};
        if (issue_title) updateFields.issue_title = issue_title;
        if (issue_text) updateFields.issue_text = issue_text;
        if (created_by) updateFields.created_by = created_by;
        if (assigned_to) updateFields.assigned_to = assigned_to;
        if (status_text) updateFields.status_text = status_text;
        if (typeof open === 'boolean') updateFields.open = open;
        updateFields.updated_on = new Date();

        // update the issue in the database
        const result = await myDataBase.collection(project).updateOne(
          { _id: ObjectId(_id) },
          { $set: updateFields }
        );

        // check if the update was successful
        if (result.modifiedCount === 1) {
          return res.json({ result: 'successfully updated', '_id': _id });
        } else {
          return res.json({ error: 'could not update', _id: _id });
        }
      } catch(e) {
        console.error(e);
        return res.json({ error: 'could not update', _id: _id });
      }
    })

    .delete(function (req, res){
      let project = req.params.project;
      const { _id } = req.body;

      //validate _id
      if (!_id || !ObjectId.isValid(_id)) {
        return res.json({ error: 'missing _id' });
      }

      // delete the issue from the database
      myDataBase.collection(project).deleteOne({ _id: ObjectId(_id) }, function(err, result) {
        if (err) {
          res.json({ error: 'could not delete', '_id': _id });
        } else {
          if (result.deletedCount === 0) {
            res.json({ error: 'could not delete', '_id': _id });
          } else {
            res.json({ result: 'successfully deleted', '_id': _id });
          }
        }
      });
    });

};
