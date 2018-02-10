'use strict';

const mongoose = require('./');;
const should = require('should');
const uuid = require('node-uuid');

describe('belongsTo', function() {
  before(function() {
    partSchema = new mongoose.Schema({});
    partSchema.belongsTo('widget');
    Part = mongoose.model('Part_' + uuid.v4(), partSchema);
    schema = Part.schema;
    subject = schema.paths.widget;
  });

  it('creates a path for widget on the schema', function() {
    should(schema.paths.widget).exist;
  });

  it('sets the relationship type', function() {
    should(subject.options.relationshipType).equal('belongsTo');
  });

  it('sets the instance', function() {
    should(subject.instance).equal('ObjectID');
  });

  it('sets the ref', function() {
    should(subject.options.ref).equal('Widget');
  });

  it('defaults required to undefined', function() {
    should(subject.isRequired).eql(false);
  });

  describe('options', function() {
    describe('custom name', function() {
      before(function() {
        partSchema = new mongoose.Schema({});
        partSchema.belongsTo('owner', { modelName: 'Widget' });
        schema = mongoose.model('Part_' + uuid.v4(), partSchema).schema;
        subject = schema.paths.owner;
      });

      it('sets the custom named path', function() {
        should(subject).not.equal(undefined);
      });

      it('sets ref to the passed in modelName', function() {
        should(subject.options.ref).equal('Widget');
      });
    });

    describe('required', function() {
      before(function() {
        partSchema = new mongoose.Schema({});
        partSchema.belongsTo('widget', { required: true });
        schema = mongoose.model('Part_' + uuid.v4(), partSchema).schema;
        subject = schema.paths.widget;
      });

      it('passes through the required field', function() {
        should(subject.isRequired).be.true;
      });
    });

    describe('polymorphic', function() {
      before(function() {
        let partSchema = new mongoose.Schema({}),
            spareSchema = new mongoose.Schema({});
        partSchema.belongsTo('assemblable', { polymorphic: true, required: true, enum: [ 'Bed', 'Dresser', 'Chair' ] });
        spareSchema.belongsTo('assemblable', { polymorphic: true, });
        schema = mongoose.model('Part_' + uuid.v4(), partSchema).schema;
        spareModel = mongoose.model('Spare_' + uuid.v4(), spareSchema).schema;
      });

      describe('ObjectID half', function() {
        before(function() { subject = schema.paths.assemblable; });

        it('exists', function() {
          should(subject).exist;
        });

        it('sets the id property', function() {
          should(subject.instance).equal('ObjectID');
        });

        it('knows it is a part of a polymorphic relationship', function() {
          should(subject.options.polymorphic).be.true;
        });

        it('passes through options', function() {
          should(subject.isRequired).eql(true);
        });
      });

      describe('Type half', function() {
        before(function() { subject = schema.paths.assemblable_type; });

        it('creates the type path', function() {
          should(subject).not.eql(undefined);
        });

        it('sets the type as String', function() {
          should(subject.instance).equal('String');
        });

        it('passes through options', function() {
          should(subject.isRequired).eql(true);
        });
      });

      describe('enum', function() {
        it('applies the provided enum to the _type path', function() {
          should(schema.paths.assemblable_type.enumValues).containDeepOrdered([ 'Bed', 'Dresser', 'Chair' ]);
        });
      });

      describe('setting required to false', function() {
        it('sets required on the id to false', function() {
          should(spareModel.paths.assemblable.isRequired).eql(false);
        });

        it('sets required on the type to false', function() {
          should(spareModel.paths.assemblable_type.isRequired).eql(false);
        });
      });
    });

    describe('touch:true', function() {
      let messageSchema, Message, message
        , mailboxSchema, Mailbox, mailbox;

      before(function() {
        messageSchema = new mongoose.Schema({ });
        messageSchema.belongsTo('mailbox', { touch: true });
        Message = mongoose.model('Message', messageSchema);

        mailboxSchema = new mongoose.Schema({ });
        mailboxSchema.hasMany('messages');
        Mailbox = mongoose.model('Mailbox', mailboxSchema);

        return Mailbox.create({}).then(function(_mailbox) {
          mailbox = _mailbox;
          return mailbox.messages.create({ });
        }).then(function (msg) {
          message = msg;
        }).catch(function (err) {
          throw (err);
        });
      });

      it('touches the parent document before save', function() {
        let oldVersion = mailbox.__v;
        return message.save().then(function(){
          return Mailbox.findById(mailbox._id);
        }).then(function(mailbox){
          should(mailbox.__v).not.eql(oldVersion);
        });
      });
    });
  });
});
