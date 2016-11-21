import storage from '../storage';

class Transaction {

	constructor(obj) {
		this.data = {
			id: obj.id,
			user: obj.user,
			account: obj.account,
			name: obj.name,
			date: obj.date,
			originalAmount: obj.local_amount,
			originalCurrency: obj.local_currency,
			category: obj.category,
			// Calculated value
			isConvertionAccurate: true, // Define is exchange rate is exact or estimated
			amount: obj.local_amount,
			currency: obj.local_currency,
		};
	}

	/**
	 * Calculate amount for a new currency
	 * @param  {Integer} newCurrency PrimaryKey of new Currency
	 * @return {Promise}
	 */
	convertTo = (newCurrency) => {
		let self = this;
		return new Promise((resolve, reject) => {
			try {
				// get change node and define ratio
                storage
                  .db
                  .transaction("changes")
                  .objectStore("changes")
                  .index("date")
                  .openCursor(IDBKeyRange.upperBound(self.data.date), "prev")
                  .onsuccess = function(event) {

                    self.data.currency = newCurrency;

                    if (event.target.result) {
                      var change = event.target.result.value;
                      // If exchange rate exist, we calculate exact change rate
                      if (change.rates.has(self.data.originalCurrency) &&
                          change.rates.get(self.data.originalCurrency).has(newCurrency)) {
                        self.data.isConvertionAccurate = true;
                        self.data.amount = self.data.originalAmount * change.rates.get(self.data.originalCurrency).get(newCurrency);
                      } else {
                      	// If not, we calculate with an estimation (if possible)
                      	// TODO
                        self.data.isConvertionAccurate = false;
                        self.data.amount = null;
                      }
                    } else {
	                	self.data.isConvertionAccurate = false;
	                    self.data.amount = null;
                    }
                    resolve();
                  };
			} catch (exception) {
				reject(exception);
			}
		});
	};

	/**
	 * Format object as JSON to transit over REST API
	 * @return {Object}
	 */
	toJSON = () => {
		return {
			id: this.data.id,
			user: this.data.user,
			account: this.data.account,
			name: this.data.name,
			date: this.data.date,
			category: this.data.category ? this.data.category : undefined,
			local_amount: this.data.originalAmount,
			local_currency: this.data.originalCurrency,
		};
	};

	/**
	 * Update values using deepmerge algo. Update convertion too.
	 * @param  {Transaction} obj [description]
	 * @return {Promise}
	 */
	update = (obj) => {
		if (!obj instanceof Transaction) {
			throw new Error('Transaction.update argument sshould be a instance of Transaction')
		}
		return new Promise((resolve, reject) => {
			this.data.name = obj.name;
			this.data.date = obj.date;
			this.data.amount = obj.amount;
			this.data.category = obj.category;
			this.data.originalAmount = obj.originalAmount;
			this.data.originalCurrency = obj.originalCurrency;
			this.convertTo(this.data.currency).then(resolve).catch(reject);

		});
	};

	/************************************************
	**				GETTER SETTER
	*************************************************/
	get id() { return this.data.id; }
	get name() { return this.data.name; }
	get date() { return this.data.date; }
	get amount() { return this.data.amount; }
	get currency() { return this.data.currency; }
	get category() { return this.data.category; }
	get originalAmount() { return this.data.originalAmount; }
	get originalCurrency() { return this.data.originalCurrency; }

}

export default Transaction;