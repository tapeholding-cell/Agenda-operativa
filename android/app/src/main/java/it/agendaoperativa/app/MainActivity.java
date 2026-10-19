package it.agendaoperativa.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AlarmClockPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
