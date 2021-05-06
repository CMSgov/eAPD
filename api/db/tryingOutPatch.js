const mongoose = require('mongoose');
const jsonPatchPlugin = require('mongoose-patcher');

const { apd } = require('../seeds/development/apds');

const convertToMongoose = async () => {
  const quarterlyFFP = new mongoose.Schema({
    combined: Number,
    contractors: Number,
    inHouse: Number
  });

  const federalCitation = new mongoose.Schema({
    title: String,
    checked: {
      type: Boolean,
      default: null
    },
    explanation: String
  });

  const incentivePayment = new mongoose.Schema({
    1: Number,
    2: Number,
    3: Number,
    4: Number
  });

  const apdSchema = new mongoose.Schema({
    name: String,
    activities: [
      {
        alternatives: String,
        contractorResources: [
          {
            description: String,
            end: Date,
            hourly: {
              data: {
                type: Map,
                of: new mongoose.Schema({
                  hours: Number,
                  rate: Number
                })
              },
              useHourly: Boolean
            },
            name: String,
            start: Date,
            totalCost: Number,
            years: {
              type: Map,
              of: Number
            }
          }
        ],
        costAllocation: {
          type: Map,
          of: new mongoose.Schema({
            ffp: {
              federal: Number,
              state: Number
            },
            other: Number
          })
        },
        costAllocationNarrative: {
          methodology: String, // this had to change slightly from the old model
          years: {
            // I had to add this (years) parent object so that the years could
            type: Map, // a map type, just wrap the years in the object in years: {}
            of: new mongoose.Schema({
              otherSources: String
            })
          }
        },
        description: String,
        expenses: [
          {
            description: String,
            category: String,
            years: {
              type: Map,
              of: Number
            }
          }
        ],
        fundingSource: {
          type: String,
          enum: ['HIE', 'HIT', 'MMIS', false]
        },
        name: String,
        outcomes: [
          {
            outcome: String,
            metrics: [
              {
                metric: String
              }
            ]
          }
        ],
        plannedEndDate: Date,
        plannedStartDate: Date,
        schedule: [
          {
            endDate: Date,
            milestone: String
          }
        ],
        standardsAndConditions: {
          doesNotSupport: String,
          supports: String
        },
        statePersonnel: [
          {
            title: String,
            description: String,
            years: {
              type: Map,
              of: new mongoose.Schema({
                amt: Number,
                perc: Number
              })
            }
          }
        ],
        summary: String,
        quarterlyFFP: {
          type: Map,
          of: new mongoose.Schema({
            1: quarterlyFFP,
            2: quarterlyFFP,
            3: quarterlyFFP,
            4: quarterlyFFP
          })
        }
      }
    ],
    federalCitations: {
      procurement: [federalCitation],
      recordsAccess: [federalCitation],
      softwareRights: [federalCitation],
      security: [federalCitation]
    },
    incentivePayments: {
      ehAmt: {
        type: Map,
        of: incentivePayment
      },
      ehCt: {
        type: Map,
        of: incentivePayment
      },
      epAmt: {
        type: Map,
        of: incentivePayment
      },
      epCt: {
        type: Map,
        of: incentivePayment
      }
    },
    keyPersonnel: [
      {
        name: String,
        position: String,
        email: String,
        isPrimary: Boolean,
        fte: {
          type: Map,
          of: Number
        },
        hasCosts: Boolean,
        costs: {
          type: Map,
          of: Number
        }
      }
    ],
    narrativeHIE: String,
    narrativeHIT: String,
    narrativeMMIS: String,
    previousActivityExpenses: {
      type: Map,
      of: new mongoose.Schema({
        hithie: {
          federalActual: Number,
          totalApproved: Number
        },
        mmis: {
          50: {
            federalActual: Number,
            totalApproved: Number
          },
          75: {
            federalActual: Number,
            totalApproved: Number
          },
          90: {
            federalActual: Number,
            totalApproved: Number
          }
        }
      })
    },
    previousActivitySummary: String,
    programOverview: String,
    stateProfile: {
      medicaidDirector: {
        name: String,
        email: String,
        phone: String
      },
      medicaidOffice: {
        address1: String,
        address2: String,
        city: String,
        state: String,
        zip: String
      }
    },
    years: [String]
  });
  apdSchema.plugin(jsonPatchPlugin, { autosave: true });

  mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true });
  const APD = mongoose.model('APD', apdSchema);

  try {
    const newApd = new APD(apd.document);
    await newApd.save();

    // const apd = await APD.findOne({ _id: '609038772cbf359ce48a6e16' });
    await newApd.jsonPatch([
      {
        op: 'replace',
        path: '/activities/0/outcomes/1/metrics/1/metric',
        value: 'Office hours availble for EPs and EHs - HELLO WORLD'
      }
    ]);
  } catch (e) {
    console.error(e);
  } finally {
    mongoose.connection.close();
  }
};

module.exports = {
  convertToMongoose
};
