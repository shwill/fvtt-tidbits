/**
 * Actor data (mockup)
 * each modable value is an object of the kind
 * 
 *    _propertyName : {
 *       base: Number,
 *       modifiers: []
 *    }
 * 
 * In the Actor's constructor, for each of those objects, getters and setters are generated as 
 * 
 *    .propertyName
 * 
 * without the underscore.
 */

const actorData = {
   name: 'John Doe',
   items: [],
   abilities: {
      str: {
         label: 'Strength',
         _value: {
            base: 0,
            modifiers: []
         },
         _save: {
            base: 0,
            modifiers: []
         }
      },
      dex: {
         label: 'Dexterity',
         _value: {
            base: 0,
            modifiers: []
         },
         _save: {
            base: 0,
            modifiers: []
         }
      },
      con: {
         label: 'Constitution',
         _value: {
            base: 0,
            modifiers: []
         },
         _save: {
            base: 0,
            modifiers: []
         }
      }
   },
   attributes: {
      ac: {
         label: 'Armor Class',
         _value: {
            base: 0,
            modifiers: []
         }
      }
   }
}

/**
 * Item data is a mockup again
 * They have modification-instructions in the 
 * 
 *    .provides[] 
 * 
 * Array.
 * 
 * They consist of
 * - type : bonus | set
 * - target: a pointer to the object-path-property to modify
 * - and a value
 * 
 * If the item .isActive === true when adding it to the actor 
 * or when enabling the item while this actor owns the item, 
 * the modifiers are inserted into the modifiers-Array of the Actors property depicted by the target-property here
 * Note the wildcards, arrays and object property-collections are supported
 * 
 * Upon disabling, the modifier is removed again
  */
const itemData = {
   name: 'Cloak of Protection',
   type: 'Equipment',
   isActive: false,
   provides: [
      {
         type: 'bonus',
         target: 'abilities.*.save',
         value: 1
      },
      {
         type: 'bonus',
         target: 'attributes.ac.value', 
         value: 1
      }
   ]
}


/**
 * Class Actor mockup
 */
class Actor {
   constructor(data) {
      this.prepareData(data);

      // create getters/ setters
      this._createAccessors(this.data);      
   }

   prepareData(actorData) {
      this.data = actorData;
   }

   // add an item to the actor's inventory
   // check if it's active, then provide the modifiers in the respective target(s)
   createOwnedItem(item) {
      this.data.items.push(item);
      if (item.data.isActive === true) {
         if (item.provides.length !== 0) {
            // insert the provider
            item.data.provides.forEach(provider => {
               this._insertProvider(
                  this.data, 
                  provider.target, 
                  {
                     type: provider.type, 
                     value: provider.bonus, 
                     sourceType: item.type, 
                     sourceName: item.name
                  }
               );
            });
         }
      }
   }

   // enabling/activating an item within the actor's inventory
   // check for modifiers and providing those, again
   enableItem(itemId) {
      if (itemId < this.data.items.length && this.data.items[itemId].data.isActive === false) {
         // enableing the item
         this.data.items[itemId].data.isActive = true;

         if (this.data.items[itemId].data.provides.length !== 0) {
            // insert the provider
            this.data.items[itemId].data.provides.forEach(provider => {
               this._insertProvider(
                  this.data, 
                  provider.target, 
                  {
                     type: provider.type, 
                     value: provider.value, 
                     sourceType: this.data.items[itemId].data.type, 
                     sourceName: this.data.items[itemId].data.name
                  }
               );
            });
         }
      }
   }

   // disabling/deactivating an item within the actor's inventory
   // check for modifiers and remove those
   disableItem(itemId) {
      if (itemId < this.data.items.length  && this.data.items[itemId].data.isActive === true) {
         // enableing the item
         this.data.items[itemId].data.isActive = false;

         if (this.data.items[itemId].data.provides.length !== 0) {
            // insert the provider
            this.data.items[itemId].data.provides.forEach(provider => {
               this._removeProvider(
                  this.data, 
                  provider.target, 
                  {
                     type: provider.type, 
                     value: provider.value, 
                     sourceType: this.data.items[itemId].data.type, 
                     sourceName: this.data.items[itemId].data.name
                  }
               );
            });
         }

      }
   }

   /**
    * Traverses an object recursively and adds getters and setters to object properties that matches a specific structure
    * 
    *    ._property {
    *       base: Number,
    *       modifiers: []
    *    }
    * 
    * @param {object} obj Object to traverse to add getters and setters
    */
   _createAccessors(obj) {
      for (let prop in obj) {
         if (typeof obj[prop] === "object") {
            if (Array.isArray(obj[prop])) {
               for (let i = 0; i < obj[prop].length; i++) {
                  this._createAccessors(obj[prop][i]);
               }
            } else {
               if (prop.indexOf('_') === 0 && obj[prop].hasOwnProperty('base') && obj[prop].hasOwnProperty('modifiers')) {
                  // create get and set accessors
                  //Object.defineProperty(obj, '_' + prop, {
                  Object.defineProperty(obj, prop.substr(1), {
                     get: () => {
                        // get 'set-base' properties first
                        // then 'set'
                        // then bonus/malus
                        let val = obj[prop].base;
                        // get the highest set modifier
                        let set = obj[prop].modifiers.filter(modifier => modifier.type === 'set').reduce((prev, cur) => { return prev > cur.value ? prev : cur.value }, 0);
                        // get the sum of all bonus modifiers
                        let bonus = obj[prop].modifiers.filter(modifier => modifier.type === 'bonus').reduce((prev, cur) => prev + cur.value, 0);

                        // Priority:
                        // Set tops the base-value
                        // Then boni are added
                        // Malus = bonus with negative value
                        let result = set !== 0 ? set + bonus : val + bonus;

                        // Professional debugging
                        /*
                        console.log("Base Value: " + val);
                        console.log("Set: " + set);
                        console.log("Bonus: " + bonus);
                        console.log("=> " + result);
                        */

                        return result;
                     },
                     // upon set, we set the base value and do not touch the modifiers
                     set: (value) => {
                        obj[prop].base = value;
                     }
                  });
               } else {
                  // not there yet, crawl happily through the object
                  this._createAccessors(obj[prop]);
               }
            }
         }
      }
   }

   // helper for inserting the providers
   _insertProvider(obj, xpath, provider) {
      this._processProvider(obj, xpath, provider, true);
   }

   // helper for removing the providers
   _removeProvider(obj, xpath, provider) {
      this._processProvider(obj, xpath, provider, false);
   }

   /**
    * Traverses an object recursively and follows the path depicted by the xpath parameter
    * WHenever it finds an modable attribute (see the structure of an modable attribute above), it adds the given provider into the modifiers[] array of said attribute
    * Then the getters/ setters do their job to calculate the accumlated value
    * 
    * @param {object} obj        the object to crawl through
    * @param {String} xpath      the property path of the actor this provides a modification to
    * @param {object} provider   an object in the following structure: { type: 'bonus' | 'set', value: Number, sourceType: 'e.g. Equipement, sourceName: 'e.g Item Name' }
    * @param {boolean} mode      is true for insertion of the modifiers and false for removing them
    */
   _processProvider(obj, xpath, provider, mode = true) {
      // if we reached the last bit of the xpath and there's a object property with the xpath's name
      if (xpath.indexOf('.') === -1 && obj.hasOwnProperty('_' + xpath)) {
         xpath = '_' + xpath;
      
         // if that's a mod-able value within this object
         // those start with an underscore, which is **not reflected in the xpath** (easy of use for the user)
         //  AND have the properties 'base' and 'modifiers[]'
         if (obj[xpath].hasOwnProperty('base') && obj[xpath].hasOwnProperty('modifiers') && Array.isArray(obj[xpath].modifiers)) {
            if (mode === true) {
               obj[xpath].modifiers.push(provider);
            } else {
               for (let i = 0; i < obj[xpath].modifiers.length; i++) {
                  if (
                     obj[xpath].modifiers[i].type === provider.type && 
                     obj[xpath].modifiers[i].value === provider.value && 
                     obj[xpath].modifiers[i].sourceType === provider.sourceType && 
                     obj[xpath].modifiers[i].sourceName === provider.sourceName) {
                     obj[xpath].modifiers.splice(i, 1);
                     break;
                  }
               }
            }
            
         }
      } else {
         // traverse deeper
         let parts = xpath.split('.');
         let property = parts.shift();
         let remainder = parts.join('.');
      
         // Wildcard property -> arrays or object property collections can be collectively addressed
         if (property === '*') {
            // it's an array, insert the provider in each of the array's elements
            if (Array.isArray(obj)) {
               for (let i = 0; i < obj[propety].length; i++) {
                  this._processProvider(obj[property][i], remainder, provider, mode);
               }
            } else {
               // it's an object, insert the provider in each of the object's properties
               if (typeof obj === 'object') {
                  // traverse all object properties
                  for (let prop in obj) {
                     this._processProvider(obj[prop], remainder, provider, mode);
                  }
               } // else: just a single property, doesn't match with the complete xpath, so noop
            }
         } else {
            if (obj.hasOwnProperty(property)) {
               // traverse deeper
               this._processProvider(obj[property], remainder, provider, mode);
            }
         }
      }
   }
}

class Item {
   constructor(data) {
      this.prepareData(data);
   }

   prepareData(itemData) {
      this.data = itemData;
   }

   enable() {
      this.data.isActive === true;
   }

   disable() {
      this.data.isActive === false;
   }
}

console.log("Creating Item (not active) and player");
var item = new Item(itemData);
var player = new Actor(actorData);

console.log("-----------------------------------------------------");
console.log("Adding the item to the player's inventory, item is still disabled");
player.createOwnedItem(item);
console.log("AC: " + player.data.attributes.ac.value);
console.log("STR Save " + player.data.abilities.str.save);
console.log("DEX Save " + player.data.abilities.dex.save);
console.log("CON Save " + player.data.abilities.con.save);

console.log("-----------------------------------------------------");
console.log("Enabling the item");
player.enableItem(0);
console.log("Item");
console.log(player.data.items[0]);
console.log("AC: " + player.data.attributes.ac.value);
console.log("STR Save " + player.data.abilities.str.save);
console.log("DEX Save " + player.data.abilities.dex.save);
console.log("CON Save " + player.data.abilities.con.save);

console.log("-----------------------------------------------------");
console.log("Disabling the item");
player.disableItem(0);
console.log("Item");
console.log(player.data.items[0]);
console.log("AC: " + player.data.attributes.ac.value);
console.log("STR Save " + player.data.abilities.str.save);
console.log("DEX Save " + player.data.abilities.dex.save);
console.log("CON Save " + player.data.abilities.con.save);

