const FiberyUnoff = require('fibery-unofficial');

class Fibery {
  /**
   *
   * @param {string} fiberyType Story, Bug ...
   * @param {string} rootEntity
   */
  constructor(fiberyType, rootEntity = 'Software Development') {
    this.fibery = new FiberyUnoff({
      host: `${process.env.FIBERY_HOST}.fibery.io`,
      token: process.env.FIBERY_TOKEN,
    });

    this.rootEntity = rootEntity;
    this.fiberyType = fiberyType;
    this.entitySelector = `${this.rootEntity}/${this.fiberyType}`;
  }

  /**
   *
   * @param {string} fiberyPublicId
   * @returns {Promise<{
   *    'fibery/id': string
   *    'fibery/public-id': string
   *    [`${this.rootEntity}/name`]: string
   *    'workflow/state': {
   *        'fibery/id': string
   *        'fiber/public-id': string
   *        'enum/name': string
   *    }
   * }>}
   */
  getEntity(fiberyPublicId) {
    return this.fibery.entity.query(
      {
        'q/from': this.entitySelector,
        'q/select': [
          'fibery/id',
          `${this.rootEntity}/name`,
          {
            // https://fibery.gitlab.io/api-docs/?javascript#select-rich-text-field
            [`${this.rootEntity}/description`]: [
              'Collaboration~Documents/secret',
            ],
          },
          {'workflow/state': ['fibery/id', 'enum/name', 'fibery/public-id']},
        ],
        'q/where': ['=', 'fibery/public-id', '$public-id'],
        'q/limit': 1,
      },
      {
        '$public-id': fiberyPublicId,
      }
    );
  }

  /**
   *
   * @param {string} fiberyId
   * @param {string} newStateFiberyId
   * @returns {Promise<void>}
   */
  updateEntityState(fiberyId, newStateFiberyId) {
    return this.fibery.entity.updateBatch([
      {
        type: this.entitySelector,
        entity: {
          'fibery/id': fiberyId,
          'workflow/state': {
            'fibery/id': newStateFiberyId,
          },
        },
      },
    ]);
  }
}

module.exports = Fibery;
