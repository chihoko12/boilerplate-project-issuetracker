'use strict';
const { ObjectId } = require('mongodb');
const myDB = require('../connection');

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
      if (query.open) {
        filter.open = query.open === 'true';
      }
      if (query.assigned_to) {
        filter.assigned_to = query.assigned_to;
      }

      if (query.issue_title) {
        filter.issue_title = query.issue_title;
      }

      if (query.status_text) {
        filter.status_text = query.status_text;
      }

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
        return res.status(400).json({ error: 'required field(s) missing' })
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
          res.status(400).json({ error: 'could not create an issue' });
        } else {
          res.json(result.ops[0]);
        }
      });
    })

    .put(function (req, res){
      let project = req.params.project;
      const {
        _id,
        issue_title,
        issue_text,
        created_by,
        assigned_to,
        status_text,
      } = req.body;

      // validate _id
      if (!_id || !ObjectId.isValid(_id)) {
        return res.status(400).json({ error: 'missing _id' });
      }

      if (!issue_title && !issue_text && !created_by && !assigned_to && !status_text ) {
        return res.status(400).json({ error: 'no update field(s) sent', '_id': _id  })
      }

      // construct the update object
      const updateFields = {};
      if (issue_title) {
        updateFields.issue_title = issue_title;
      }

      if (issue_text) {
        updateFields.issue_text = issue_text;
      }

      if (created_by) {
        updateFields.created_by = created_by;
      }

      if (assigned_to) {
        updateFields.assigned_to = assigned_to;
      }

      if (status_text) {
        updateFields.status_text = status_text;
      }

      updateFields.updated_on = new Date();

      // update the issue in the database
      myDataBase.collection(project).updateOne({ _id: ObjectId(_id)}, { $set: updateFields }, function(err, result) {
        if (err) {
          res.status(400).json({ error: 'could not update', '_id': _id });
        } else {
          if (result.matchedCount === 0) {
            res.status(400).json({ error: 'could not update', '_id': _id });
          } else {
            res.json({ result: 'successfully updated', '_id': _id });
          }
        }
      });
    })

    .delete(function (req, res){
      let project = req.params.project;
      const { _id } = req.body;

      //validate _id
      if (!_id || !ObjectId.isValid(_id)) {
        return res.status(400).json({ error: 'missing _id' });
      }

      // delete the issue from the database
      myDataBase.collection(project).deleteOne({ _id: ObjectId(_id) }, function(err, result) {
        if (err) {
          res.status(400).json({ error: 'could not delete', '_id': _id });
        } else {
          if (result.deletedCount === 0) {
            res.status(400).json({ error: 'could not delete', '_id': _id });
          } else {
            res.json({ result: 'successfully deleted', '_id': _id });
          }
        }
      });
    });

};
