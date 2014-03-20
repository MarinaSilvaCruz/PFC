package com.example.marina;

import java.util.List;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.ListView;

public class screen3 extends Activity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main3);
        ListView lv = (ListView)findViewById(R.id.list);
        CadastroDAO dao = new CadastroDAO(this);
		List<String> cartoes = dao.getCartoes();
		dao.close();
		ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_list_item_1, cartoes);
		lv.setAdapter(adapter);
	}
}
