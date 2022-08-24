function getPagination(query){
    const DEFAULT_PAGE_NUMBER = 1;
    const DEFAULT_PAGE_LIMIT = 0; 

    // Value retuned from query string is a string, abs(x) returns d absolute value of a number (-1 = 1, 1=1, '2' =2)
    // if a string is passed, it will convert it to a number
    const page = Math.abs(query.page) || DEFAULT_PAGE_NUMBER;
    const limit = Math.abs(query.limit) || DEFAULT_PAGE_LIMIT;

    const skip = (page - 1) * limit;

    return {
        skip, limit
    }
}

module.exports = {
    getPagination
}