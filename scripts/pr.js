/**
 * @type {{
 *  ACTION: 'opened' | 'edited' | 'reopened' | 'closed'
 *  TITLE: string
 * }}
 */
const {ACTION, TITLE} = process.env;

const Fibery = require('./fibery');

const WORKFLOW_STATES = {
  TODO: '55fcaa80-e260-11e8-8b93-e87652ad58c1',
  IN_PROGRESS: '55fe7f40-e260-11e8-8b93-e87652ad58c1',
  DONE: '55ffded0-e260-11e8-8b93-e87652ad58c1',
};

/**
 * @typedef {{
 *  workState: string
 *  fiberyType: string
 *  fiberyPublicId: string
 * }} fiberyUtils
 */

/**
 *
 * @param {string} title
 * @param {string} action
 * @returns {fiberyUtils}
 */
const parsePRTitle = (title, action) => {
  const prefix = /^fibery\//;
  const postfix = /:.+$/;

  // extraction => fibery/["ip-"?][type]#[number]["(main)"?]: foo-bar
  let extracted = title.replace(prefix, '');
  extracted = extracted.replace(postfix, '').trim();

  // ["ip-"?][type]#[number]["(main)"?]
  const inProgress = /^ip-/;

  let STATE = WORKFLOW_STATES.DONE;
  if (action !== 'closed') {
    if (inProgress.test(extracted)) {
      STATE = WORKFLOW_STATES.IN_PROGRESS;
    }
  } else {
    // CHECK IF PR IS MERGED => NOT CLOSED
  }
  extracted = extracted.replace(inProgress, '').trim();

  // get type
  // [type]#[number]["(main)"?]
  const typeRegex = /^([A-Za-z]*)#/;
  // slice last char because it is "#"
  const fiberyType = extracted.match(typeRegex)[0].slice(0, -1);

  // get number
  // [number]["(main)"?]
  extracted = extracted.replace(typeRegex, '').trim();
  const digits = /^\d*/;
  const fiberyPublicId = extracted.match(digits)[0];

  return {
    workState: STATE,
    fiberyType,
    fiberyPublicId,
  };
};

const main = async () => {
  /**
   * @type {fiberyUtils}
   */
  let fiberyUtils = null;
  try {
    fiberyUtils = parsePRTitle(TITLE, ACTION);
  } catch (e) {
    throw new Error(`Error parsing title ${TITLE}
        Error: ${e}
    `);
  }

  const CustomFibery = new Fibery(fiberyUtils.fiberyType);

  try {
    const [entity] = await CustomFibery.getEntity(fiberyUtils.fiberyPublicId);
    await CustomFibery.updateEntityState(
      entity['fibery/id'],
      fiberyUtils.workState
    );
  } catch (e) {
    throw new Error(`Error updating entity
          For type => ${fiberyUtils.fiberyType}
          public-id => ${fiberyUtils.fiberyPublicId}

          Error: ${e}
        `);
  }
};

main();
