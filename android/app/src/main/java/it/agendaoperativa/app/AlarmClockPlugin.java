package it.agendaoperativa.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.provider.AlarmClock;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Calendar;

/** Crea una sveglia vera nell'app Orologio del telefono. */
@CapacitorPlugin(name = "AlarmClock")
public class AlarmClockPlugin extends Plugin {
    private static final int[] DAYS = { Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY,
        Calendar.THURSDAY, Calendar.FRIDAY, Calendar.SATURDAY, Calendar.SUNDAY };

    @PluginMethod
    public void set(PluginCall call) {
        Integer hour = call.getInt("hour");
        Integer minute = call.getInt("minute");
        if (hour == null || minute == null) { call.reject("Ora mancante"); return; }
        Intent i = new Intent(AlarmClock.ACTION_SET_ALARM);
        i.putExtra(AlarmClock.EXTRA_HOUR, hour);
        i.putExtra(AlarmClock.EXTRA_MINUTES, minute);
        i.putExtra(AlarmClock.EXTRA_MESSAGE, call.getString("message", "Attività"));
        i.putExtra(AlarmClock.EXTRA_SKIP_UI, call.getBoolean("skipUi", true));
        JSArray days = call.getArray("days");
        if (days != null && days.length() > 0) {
            ArrayList<Integer> list = new ArrayList<>();
            try {
                for (int k = 0; k < days.length(); k++) {
                    int d = days.getInt(k);
                    if (d >= 1 && d <= 7) list.add(DAYS[d - 1]);
                }
            } catch (Exception ignored) { }
            if (!list.isEmpty()) i.putExtra(AlarmClock.EXTRA_DAYS, list);
        }
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getActivity().startActivity(i);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("Nessuna app Orologio trovata", "no_clock");
        }
    }
}
