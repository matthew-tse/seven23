import moment from "moment";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import StatisticsActions from "../../actions/StatisticsActions";
import TransactionTable from "../transactions/TransactionTable";

export default function TripDetails({ onEdit, onDuplicate }) {
  const dispatch = useDispatch();
  const nomadlist = useSelector(state =>
    state.user.socialNetworks ? state.user.socialNetworks.nomadlist || {} : {}
  );

  let { id } = useParams();

  const trips = nomadlist ? nomadlist.data.trips : null;
  const [trip, setTrip] = useState(trips[parseInt(id) - 1]);
  const [statistics, setStatistic] = useState(null);

  const performSearch = () => {
    if (trips[parseInt(id) - 1]) {
      setStatistic(null);

      dispatch(
        StatisticsActions.report(
          moment(trips[parseInt(id) - 1].date_start).toDate(),
          moment(trips[parseInt(id) - 1].date_end)
            .endOf("day")
            .toDate()
        )
      ).then(result => {
        setStatistic(result);
      });
    }
  };

  useEffect(() => {
    setTrip(trips[parseInt(id) - 1]);
    performSearch();
  }, [id]);

  const reduxTransaction = useSelector(state => state.transactions);

  useEffect(() => {
    if (reduxTransaction) {
      performSearch();
    } else {
      setStatistic(null);
    }
  }, [reduxTransaction]);

  return (
    <div style={{ padding: "2px 20px" }}>
      {trip && (
        <header>
          <h2 className="hideMobile">
            {trip.place} - {trip.country}
          </h2>
          <p>
            <strong>
              {moment(trip.date_end).diff(moment(trip.date_start), "day")} days
            </strong>
            , from <strong>{moment(trip.date_start).format("LL")}</strong> until{" "}
            <strong>{moment(trip.date_end).format("LL")}</strong>
          </p>
        </header>
      )}
      <h3>
        {statistics && statistics.transactions ? (
          statistics.transactions.length
        ) : (
          <span className="loading w80"></span>
        )}{" "}
        transactions
      </h3>
      {statistics && statistics.transactions && (
        <TransactionTable
          transactions={statistics.transactions}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          pagination="40"
          dateFormat="DD MMM YY"
        />
      )}
      {!statistics && (
        <TransactionTable
          transactions={[]}
          isLoading={true}
          pagination="40"
          dateFormat="DD MMM YY"
        />
      )}
    </div>
  );
}