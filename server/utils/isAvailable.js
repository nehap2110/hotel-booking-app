module.exports = (hotel, from, to, beds) => {
  let bookedBeds = 0;

  hotel.bookedDates.forEach(b => {
    if (
      from < b.to &&
      to > b.from
    ) {
      bookedBeds += b.beds;
    }
  });

  return (hotel.bed - bookedBeds) >= beds;
};
