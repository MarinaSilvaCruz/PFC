package com.example.marina;



import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
public class screen2 extends Activity {
	@Override
	public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.main2);
        
        

        Button Registrar  = (Button) findViewById(R.id.button02);
        Registrar.setOnClickListener(new View.OnClickListener() {
            @Override
        	public void onClick(View view) {
            	EditText nome = (EditText)findViewById(R.id.nome);
            	EditText bcartao = (EditText)findViewById(R.id.bcartao);
            	EditText ncartao = (EditText)findViewById(R.id.ncartao);
            	EditText senha = (EditText)findViewById(R.id.senha);
            	
            	Cadastro cad = new Cadastro();
            	cad.setNome(nome.getEditableText().toString());
            	cad.setBcartao(bcartao.getEditableText().toString());
            	cad.setNcartao(ncartao.getEditableText().toString());
            	cad.setSenha(senha.getEditableText().toString());
            	
            	CadastroDAO dao = new CadastroDAO(screen2.this);
            	dao.getWritableDatabase();
            	dao.adicionar(cad);
            	dao.close();
            	
            	startActivity(new Intent(screen2.this , MainActivity.class) );
            	
            	
            	//Intent intent = new Intent(screen2.this , MainActivity.class);
            	//startActivity(intent);
            	
/*            	
            	Intent myIntent = new Intent(view.getContext(), MainActivity.class);
                startActivityForResult(myIntent, 0);*/
            }

        });
}
}