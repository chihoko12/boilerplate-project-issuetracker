const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let firstIssueId;

suite('Functional Tests', function() {

  test('Create an issue with every field', function(done) {
    chai
      .request(server)
      .post('/api/issues/apitest')
      .send({
        issue_title: "test Issue",
        issue_text: "This User",
        created_by: "Test User",
        assigned_to: "Test Assignee",
        status_text: "In progress"
      })
      .end(function(err,res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'issue_title');
        assert.property(res.body, 'issue_text');
        assert.property(res.body, 'created_by');
        assert.property(res.body, 'assigned_to');
        assert.property(res.body, 'status_text');
        done();
      });
  });


  test('Create an issue with only required fields', function(done) {
    chai
      .request(server)
      .post('/api/issues/apitest')
      .send({
        issue_title: "Test Issue",
        issue_text: "This is a test issue",
        created_by: "Test User"
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        assert.property(res.body, 'issue_title');
        assert.property(res.body, 'issue_text');
        assert.property(res.body, 'created_by');
        done();
      });
  });

  test('Create an issue with missing required fields', function(done) {
    chai
      .request(server)
      .post('/api/issues/apitest')
      .send({
        issue_text: "This is a test issue",
        created_by: "Test User"
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        assert.equal(res.body.error, 'required field(s) missing');
        done();
      });
  });

  test('View issues on a project', function(done) {
    chai
      .request(server)
      .get('/api/issues/apitest')
      .end(function(err,res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);

        if (res.body.length > 0) {
          firstIssueId = res.body[0]._id;
        } else {
          firstIssueId = null;
        }
        done();
      });
  });

  test('View issues on a project with one filter', function(done) {
    chai
      .request(server)
      .get('/api/issues/apitest')
      .query({
        open: true
      })
      .end(function(err,res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  test('View issues on a project with multiple filters', function(done) {
    chai
      .request(server)
      .get('/api/issues/apitest')
      .query({
        open: true,
        assigned_to: 'Joe'
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        done();
      });
  });

  test('Update one field on an issue', function(done) {
    chai
      .request(server)
      .put('/api/issues/apitest')
      .send({
        _id: firstIssueId,
        issue_title: "Update Title"
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        assert.equal(res.body.result, 'successfully updated');
        done();
      });
  });

  test('Update multiple fields on an issue', function(done) {
    chai
      .request(server)
      .put('/api/issues/apitest')
      .send({
        _id: firstIssueId,
        issue_title: "Updated Title",
        issue_text: "Updated Text",
        assigned_to: "Updated Assignee"
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        assert.equal(res.body.result, 'successfully updated');
        done();
      });
  });

  test('Update an issue with missing _id', function(done) {
    chai
      .request(server)
      .put('/api/issues/apitest')
      .send({
        issue_title: "Updated Title",
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        done();
      });
  });

  test('Update an issue with no fields to upgrade', function(done) {
    chai
      .request(server)
      .put('/api/issues/apitest')
      .send({
        _id: "valid_id",
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        done();
      });
  });

  test('Update an issue with an invalid _id', function(done) {
    chai
      .request(server)
      .put('/api/issues/apitest')
      .send({
        _id: 'invalid_id',
        issue_title: 'Updated Title'
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        done();
      });
  });

  test('Delete an issue', function(done) {
    chai
      .request(server)
      .delete('/api/issues/apitest')
      .send({
        _id: firstIssueId,
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        assert.equal(res.body.result, 'successfully deleted');
        done();
      });
  });

  test('Delete an issue with an invalid _id', function(done) {
    chai
      .request(server)
      .delete('/api/issues/apitest')
      .send({
        _id: "invalid_id",
      })
      .end(function(err,res) {
        assert.equal(res.status,200);
        done();
      });
  });

  test('Delete an issue with missing _id', function (done) {
    chai
      .request(server)
      .delete('/api/issues/apitest')
      .end(function(err,res) {
        assert.equal(res.status,200);
        done();
      });
  });

});
