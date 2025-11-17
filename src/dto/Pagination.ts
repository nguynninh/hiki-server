const Pagination = (
    page: number,
    limit: number,
    totalItems: number,
): any => {
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = page > totalPages ? totalPages : page;

    const skip = (currentPage - 1) * limit;

    const prevPage = currentPage > 1 ? currentPage - 1 : null;
    const nextPage = currentPage < totalPages ? currentPage + 1 : null;

    return {
        page,
        limit,
        skip,
        totalItems,
        totalPages,
        prevPage,
        nextPage,
    };
};

export default Pagination;