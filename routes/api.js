'use strict';
const { ObjectId } = require('mongodb');

module.exports = function (app, db) {

  app.route('/api/issues/:project')

    .get(function (req, res){
      let project = req.params.project;

      // extract query parameters for filtering
      const query = req.query;

      // construct the filter object based on query parameters
      const filter = {};
      if (query.open) {
        filter.open = query.open;
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
      db.collection(project).find(filter).toArray(function(err,issues) {
        if (err) {
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          res.json(issues);
        }
      });
     })

    .post(function (req, res){
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      // validate required fields
      if (!issue_title || !issue_text || !created_by) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      // create a new issue object
      const newIssue = {
        issue_title,
        issue_text,
        created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      };

      // insert the new issue into the database
      db.collection(project).insertOne(newIssue, function(err,result) {
        if (err) {
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          res.json(result.ops[0]);
        }
      });
    })

    .put(function (req, res){
      let project = req.params.project;
      const { _id, issue_title, issue_text, assigned_to, status_text, open } = req.body;

      // validate _id
      if (!_id) {
        return ers.status(400).json({ error: 'Missing _id field' });
      }

      // construct the update object
      const updateFields = {};
      if (issue_title) {
        updateFields.issue_title = issue_title;
      }

      if (assigned_to) {
        updateFields.assigned_to = assigned_to;
      }

      if (status_text) {
        updateFields.status_text = status_text;
      }

      if (open !== undefined) {
        updateFields.open = open;
      }
      updateFields.updated_on = new Date();

      // update the issue in the database
      db.collection(project).updateOne({ _id: ObjectId(_id)}, { $set: updateFields }, function(err, result) {
        if (err) {
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          if (result.matchedCount === 0) {
            res.status(404).json({ error: 'Issue not found' });
          } else {
            res.json({ result: 'successfully updated', _id });
          }
        }
      });
    })

    .delete(function (req, res){
      let project = req.params.project;
      const { _id } = req.body;

      //validate _id
      if (!_id) {
        return res.status(400).json({ error: 'Missing _id field' });
      }

      // delete the issue from the database
      db.collection(project).deleteOne({ _id: ObjectId(_id) }, function(err, result) {
        if (err) {
          res.status(500).json({ error: 'Internal Server Error' });
        } else {
          if (result.deletecCount === 0) {
            res.status(404).json({ error: 'Issue not found' });
          } else {
            res.json({ result: 'successfully deleted', _id });
          }
        }
      });
    });

};
