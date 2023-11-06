import interactionPlugin from "@fullcalendar/interaction";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import FullCalendar from "@fullcalendar/react";
import FrLocale from "@fullcalendar/core/locales/fr";

import {useContext, useRef} from "react";
import Button from "../../components/common/Layout/Button/Button";
import {fetchPlanning} from "../../utils/api/api";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useEffectOnce, useReadLocalStorage} from "usehooks-ts";
import {AurionEventType} from "../../types/event";
import {ToastContext, ToastContextType} from "../../contexts/toastContext";
import "./planning.scss";
import styles from "./planning.module.scss";
import {ModalContext, ModalContextType} from "../../contexts/modalContext";
import {getICS} from "./logic";
import AddEventModalContent from "./AddEventModal";
import dayjs from "dayjs";
import PageTemplate from "../Template";

// TODO : Delete event

const calendarQuery = async (planning: AurionEventType[] | null) => {
  if (planning) {
    return planning;
  }
  return await fetchPlanning();
};

const Planning = () => {
  const queryClient = useQueryClient();
  const storedPlanning = useReadLocalStorage<AurionEventType[] | null>(
    "planning"
  );

  const userEvents = useReadLocalStorage<AurionEventType[] | null>(
    "userEvents"
  );

  const { isLoading, data } = useQuery({
    queryKey: ["planning"],
    queryFn: async () => await calendarQuery(storedPlanning),
    networkMode: "always",
  });

  const { openToast } = useContext(ToastContext) as ToastContextType;

  const refreshMutation = useMutation({
    mutationFn: async () => {
      return fetchPlanning();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["planning"], data);
      openToast({
        type: "success",
        title: "Et hop !",
        content: "Planning actualisé avec succès",
      });
    },
  });

  const handleRefresh = (event: CustomEvent) => {
    refreshMutation.mutateAsync().then(() => {
      event.detail.complete();
    });
  };

  const { openModal } = useContext(ModalContext) as ModalContextType;

  const calendarRef = useRef<FullCalendar>(null);
  const lastUpdate = useReadLocalStorage<string>("lastPlanningUpdate");

  useEffectOnce(() => {
    // This is to prevent fullCalendar lag
    setTimeout(function () {
      window.dispatchEvent(new Event("resize"));
    }, 1);
  });

  const openAddEventModal = () => {
    openModal(<AddEventModalContent />);
  };

  const AddEventButton = () => (
    <Button
      className={styles["create-event-button"]}
      onClick={openAddEventModal}
      variant={"accent"}
      round={true}
    >
      +
    </Button>
  );

  if (isLoading) {
    return (
      <PageTemplate
        title={"Planning"}
        onRefresh={handleRefresh}
        isLoading={true}
      />
    );
  }

  return (
    <PageTemplate
      title={"Planning"}
      onRefresh={handleRefresh}
      header={<AddEventButton />}
    >
      <section>
        <FullCalendar
          ref={calendarRef}
          locale={FrLocale}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "today",
            center: "timeGridWeek,timeGridDay",
            right: "prev,next",
          }}
          slotMinTime="07:00:00"
          slotMaxTime="22:00:00"
          titleFormat={{ month: "short", day: "numeric" }}
          allDaySlot={false}
          firstDay={0}
          hiddenDays={[0]}
          eventSources={[data, userEvents]}
          eventColor="#3f2a56"
          contentHeight="auto"
          nowIndicator={true}
          stickyHeaderDates={false}
          editable={false}
          eventAllow={() => false}
          droppable={false}
          eventStartEditable={false}
          eventDurationEditable={false}
          eventResizableFromStart={false}
          eventDragMinDistance={0}
          eventClick={(info) => window.alert(info.event.title)}
        />
        <div className="last-update">
          Dernière actualisation :{" "}
          {lastUpdate ? dayjs(lastUpdate).fromNow() : "jamais"}
        </div>
      </section>

      <Button size={"sm"} round={true} onClick={() => getICS(data)}>
        Exporter le planning
      </Button>
    </PageTemplate>
  );
};

export default Planning;
