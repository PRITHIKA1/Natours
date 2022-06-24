class APIFeatures {
    constructor(query, queryString) {   // queryString (from express) is req.query (from routes) --- query is from mongoose
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach( el => delete queryObj[el]);

        // 1B) ADVANCED FILTERING ( VIDEO : 95 )
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        this.query.find(JSON.parse(queryStr));
        return this;  //returns entire object
    }

    sort () {
        if(this.queryString.sort) {
        const sortBy = this.queryString.sort.split(',').join(' ');
        this.query = this.query.sort(sortBy);
    }
    else {
        this.query = this.query.sort('-createdAt');  //newest one appears first
    }
    return this;  //returns entire object
    }

    limitFields() {
        if(this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v'); // '-' excludes __v
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;   // to convert string to number
        const limit = this.queryString.limit * 1 || 100;
        const skip =  (page - 1) * limit;

        // page=2&limit=10 resuls from 1 to 10 in page 1 and the 11 to 20 in page 2 and so on
        
        this.query = this.query.skip(skip).limit(limit)  // limit --> amount of result that we want in the query  skip --> amount of result to be skipped before querying the data

        return this;
    }
}

module.exports = APIFeatures;